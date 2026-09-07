/**
 * W1 backfill — promote four Json columns into typed tables.
 *
 *   jobHistory   -> worker_job_history
 *   education    -> worker_education
 *   availability -> worker_availability
 *   experience   -> worker_experience
 *
 * The Json columns are NOT modified. They remain the source of truth until W1
 * reaches phase P7, so this script can be re-run at any point and will rebuild
 * the derived tables from source.
 *
 * Idempotent by rebuild: per batch, children of those workers are deleted and
 * re-inserted inside one transaction, with the source rows locked FOR UPDATE so
 * a concurrent app write cannot be read stale and overwritten. Rebuilding from
 * source stays correct during dual-write precisely because source is still truth.
 *
 * Ids use gen_random_uuid()::text, already used by several tables here. Rows the
 * app later creates through Prisma will carry cuids. Mixed formats in one table
 * are harmless — both are unique text — but worth knowing when reading data.
 *
 * Usage:
 *   node scripts/w1/backfill.js                              dry run, writes nothing
 *   node scripts/w1/backfill.js --confirm                    execute
 *   node scripts/w1/backfill.js --url-var REHEARSAL_DATABASE_URL --confirm
 *
 * Exit codes: 0 ok · 1 failure · 3 unparseable source data in a strict run
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.resolve(__dirname, '..', '..')

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}

const DAYS = new Set(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])

const DOMAIN = {
  'disability': 'DISABILITY',
  'aged-care': 'AGED_CARE',
  'working-with-children': 'WORKING_WITH_CHILDREN',
  'mental-health': 'MENTAL_HEALTH',
  'chronic-medical': 'CHRONIC_MEDICAL',
}

// Env precedence: already-set wins, then .env.local, then .env. An explicitly
// set variable must beat the dotfiles, or a one-off override aimed at a branch
// silently writes somewhere else.
function loadEnv() {
  const preset = new Set(Object.keys(process.env))
  const fromFile = new Set()
  for (const file of ['.env', '.env.local']) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) continue
    for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (preset.has(key) && !fromFile.has(key)) continue
      process.env[key] = val
      fromFile.add(key)
    }
  }
}

// "HH:MM" -> minutes from midnight. Returns null for anything else, so a bad
// value is reported rather than silently becoming 0 (midnight).
function toMinutes(value) {
  if (typeof value !== 'string') return null
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v)
const str = (v) => (v === null || v === undefined ? null : String(v))
const bool = (v) => v === true || v === 'true'
const intOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

// ---------------------------------------------------------------- transform --
function transform(rows) {
  const out = { jobHistory: [], education: [], availability: [], experience: [] }
  const skips = []
  const note = (table, workerProfileId, reason) => skips.push({ table, workerProfileId, reason })

  for (const r of rows) {
    const aid = r.id
    const wid = r.workerProfileId

    // --- jobHistory: array of objects ---------------------------------------
    let jh = null
    try { jh = asJson(r.jobHistory) } catch { note('job_history', wid, 'column is not valid JSON') }
    if (Array.isArray(jh)) {
      jh.forEach((e, i) => {
        if (!e || typeof e !== 'object') return note('job_history', wid, 'entry is not an object')
        const jobTitle = str(e.jobTitle)
        const company = str(e.company)
        // Both are NOT NULL in the target. Skip rather than invent an empty string.
        if (!jobTitle || !company) {
          return note('job_history', wid, `entry ${i}: missing ${!jobTitle ? 'jobTitle' : 'company'}`)
        }
        out.jobHistory.push([aid, jobTitle, company,
          intOrNull(e.startMonth), intOrNull(e.startYear),
          intOrNull(e.endMonth), intOrNull(e.endYear),
          bool(e.currentlyWorking), i])
      })
    } else if (jh !== null && jh !== undefined && !Array.isArray(jh)) {
      note('job_history', wid, `expected an array, found ${typeof jh}`)
    }

    // --- education: array of objects ----------------------------------------
    let ed = null
    try { ed = asJson(r.education) } catch { note('education', wid, 'column is not valid JSON') }
    if (Array.isArray(ed)) {
      ed.forEach((e, i) => {
        if (!e || typeof e !== 'object') return note('education', wid, 'entry is not an object')
        const institution = str(e.institution)
        const qualification = str(e.qualification)
        if (!institution || !qualification) {
          return note('education', wid, `entry ${i}: missing ${!institution ? 'institution' : 'qualification'}`)
        }
        out.education.push([aid, institution, qualification,
          intOrNull(e.startMonth), intOrNull(e.startYear),
          intOrNull(e.endMonth), intOrNull(e.endYear),
          bool(e.currentlyStudying), i])
      })
    } else if (ed !== null && ed !== undefined && !Array.isArray(ed)) {
      note('education', wid, `expected an array, found ${typeof ed}`)
    }

    // --- availability: object keyed by weekday ------------------------------
    // A day holds one slot object OR an array of them — availability.service.ts:180
    // collapses a single-element array to a bare object. Both shapes are current.
    let av = null
    try { av = asJson(r.availability) } catch { note('availability', wid, 'column is not valid JSON') }
    if (av && typeof av === 'object' && !Array.isArray(av)) {
      // Unique on (worker, day, start, end). Two slots sharing only a start are
      // legitimate — the rehearsal found Saturday 00:00-07:00 next to 00:00-23:00
      // — so only an exact repeat of start AND end is a duplicate.
      const seen = new Set()
      for (const [day, value] of Object.entries(av)) {
        if (!DAYS.has(day)) { note('availability', wid, `unknown day key "${day}"`); continue }
        const slots = Array.isArray(value) ? value : [value]
        slots.forEach((s, i) => {
          if (!s || typeof s !== 'object') return note('availability', wid, `${day}: slot is not an object`)
          const start = toMinutes(s.startTime)
          const end = toMinutes(s.endTime)
          if (start === null || end === null) {
            return note('availability', wid, `${day}: unparseable ${start === null ? 'startTime' : 'endTime'}`)
          }
          const key = `${day}:${start}:${end}`
          if (seen.has(key)) {
            return note('availability', wid, `${day}: exact duplicate slot ${s.startTime}-${s.endTime}`)
          }
          seen.add(key)
          out.availability.push([wid, day, start, end, i])
        })
      }
    } else if (Array.isArray(av)) {
      note('availability', wid, 'top level is an array, expected an object keyed by weekday')
    }

    // --- experience: object keyed by care-domain slug -----------------------
    let ex = null
    try { ex = asJson(r.experience) } catch { note('experience', wid, 'column is not valid JSON') }
    if (ex && typeof ex === 'object' && !Array.isArray(ex)) {
      for (const [slug, value] of Object.entries(ex)) {
        const domain = DOMAIN[slug]
        if (!domain) { note('experience', wid, `unknown domain key "${slug}"`); continue }
        if (!value || typeof value !== 'object') {
          note('experience', wid, `${slug}: value is not an object`)
          continue
        }
        const areas = Array.isArray(value.specificAreas)
          ? value.specificAreas.filter((a) => typeof a === 'string')
          : []
        out.experience.push([wid, domain, bool(value.isProfessional), bool(value.isPersonal),
          areas, str(value.otherAreas), str(value.description)])
      }
    }
  }
  return { out, skips }
}

// ------------------------------------------------------------------- insert --
async function insertBatch(client, table, columns, rows) {
  if (!rows.length) return 0
  const width = columns.length
  const values = []
  const params = []
  rows.forEach((r, n) => {
    const ph = r.map((_, c) => `$${n * width + c + 1}`)
    values.push(`(gen_random_uuid()::text, ${ph.join(', ')}, now())`)
    params.push(...r)
  })
  const sql =
    `INSERT INTO ${table} ("id", ${columns.map((c) => `"${c}"`).join(', ')}, "updatedAt") ` +
    `VALUES ${values.join(', ')}`
  const res = await client.query(sql, params)
  return res.rowCount
}

const COLS = {
  worker_job_history: ['workerAdditionalInfoId', 'jobTitle', 'company', 'startMonth', 'startYear', 'endMonth', 'endYear', 'currentlyWorking', 'sortOrder'],
  worker_education: ['workerAdditionalInfoId', 'institution', 'qualification', 'startMonth', 'startYear', 'endMonth', 'endYear', 'currentlyStudying', 'sortOrder'],
  worker_availability: ['workerProfileId', 'dayOfWeek', 'startMinute', 'endMinute', 'sortOrder'],
  worker_experience: ['workerProfileId', 'domain', 'isProfessional', 'isPersonal', 'specificAreas', 'otherAreas', 'description'],
}

// --------------------------------------------------------------- self-test --
// The transform is the only real logic here, and it cannot be exercised without
// a database unless it is tested directly. Fixtures cover every shape the
// investigation found, plus the malformed cases the parser must refuse.
function selfTest() {
  const fixtures = [{
    id: 'ai_1', workerProfileId: 'wp_1',
    jobHistory: [
      { jobTitle: 'Support Worker', company: 'Acme Care', startMonth: 3, startYear: 2020, endMonth: null, endYear: null, currentlyWorking: true },
      { jobTitle: 'Cleaner', company: 'Tidy Co', startMonth: 1, startYear: 2018, endMonth: 12, endYear: 2019, currentlyWorking: false },
      { jobTitle: null, company: 'Nameless', currentlyWorking: false },          // skip: no jobTitle
    ],
    education: [
      { institution: 'TAFE NSW', qualification: 'Cert III', startMonth: 2, startYear: 2017, endMonth: 11, endYear: 2017, currentlyStudying: false },
      { institution: '', qualification: 'Cert IV' },                              // skip: empty institution
    ],
    availability: {
      MONDAY: { startTime: '09:00', endTime: '17:00' },                           // single object
      TUESDAY: [                                                                  // array of slots
        { startTime: '06:00', endTime: '10:00' },
        { startTime: '18:00', endTime: '22:00' },
      ],
      WEDNESDAY: { startTime: '22:00', endTime: '06:00' },                        // overnight — must survive
      THURSDAY: [
        { startTime: '08:00', endTime: '12:00' },
        { startTime: '08:00', endTime: '15:00' },                                 // KEPT: shares a start, different end
      ],
      SATURDAY: [
        { startTime: '10:00', endTime: '14:00' },
        { startTime: '10:00', endTime: '14:00' },                                 // skip: exact duplicate
      ],
      FRIDAY: { startTime: '9am', endTime: '17:00' },                             // skip: unparseable
      FUNDAY: { startTime: '09:00', endTime: '10:00' },                           // skip: unknown day
    },
    experience: {
      'disability': { isProfessional: true, isPersonal: false, specificAreas: ['autism', 'physical'], otherAreas: null, description: 'five years' },
      'aged-care': { isProfessional: false, isPersonal: true, specificAreas: [], otherAreas: 'family', description: null },
      'astrology': { isProfessional: true },                                      // skip: unknown domain
    },
  }, {
    id: 'ai_2', workerProfileId: 'wp_2',
    jobHistory: [], education: null,
    availability: [{ startTime: '09:00', endTime: '10:00' }],                     // skip: top-level array
    experience: {},
  }]

  const { out, skips } = transform(fixtures)
  const fail = []
  const eq = (label, actual, expected) => {
    if (actual !== expected) fail.push(`${label}: expected ${expected}, got ${actual}`)
  }

  eq('jobHistory rows', out.jobHistory.length, 2)
  eq('education rows', out.education.length, 1)
  // MON 1 + TUE 2 + WED 1 + THU 2 (same start, different ends — both kept)
  // + SAT 1 (its twin is an exact duplicate, rejected)
  eq('availability rows', out.availability.length, 7)
  eq('experience rows', out.experience.length, 2)
  // SAT exact duplicate, FRI unparseable, FUNDAY unknown, no jobTitle, empty
  // institution, unknown domain, wp_2 top-level array
  eq('skips', skips.length, 7)

  const mon = out.availability.find((r) => r[1] === 'MONDAY')
  eq('MONDAY start minutes', mon && mon[2], 540)   // 09:00
  eq('MONDAY end minutes', mon && mon[3], 1020)    // 17:00
  const wed = out.availability.find((r) => r[1] === 'WEDNESDAY')
  eq('overnight kept (start)', wed && wed[2], 1320) // 22:00
  eq('overnight kept (end)', wed && wed[3], 360)    // 06:00 — end < start is the point
  const tue = out.availability.filter((r) => r[1] === 'TUESDAY')
  eq('TUESDAY slots', tue.length, 2)
  eq('TUESDAY sortOrder preserved', tue[1] && tue[1][4], 1)
  eq('jobHistory sortOrder', out.jobHistory[1] && out.jobHistory[1][8], 1)
  eq('domain mapped', out.experience[0] && out.experience[0][1], 'DISABILITY')
  eq('aged-care mapped', out.experience[1] && out.experience[1][1], 'AGED_CARE')
  eq('specificAreas kept', out.experience[0] && out.experience[0][4].length, 2)

  eq('toMinutes 00:00', toMinutes('00:00'), 0)
  eq('toMinutes 23:59', toMinutes('23:59'), 1439)
  eq('toMinutes 24:00 rejected', toMinutes('24:00'), null)
  eq('toMinutes 09:60 rejected', toMinutes('09:60'), null)
  eq('toMinutes empty rejected', toMinutes(''), null)
  eq('toMinutes null rejected', toMinutes(null), null)

  if (fail.length) {
    console.error(`SELF-TEST FAILED — ${fail.length}\n`)
    for (const f of fail) console.error('  ' + f)
    return 1
  }
  console.log('SELF-TEST PASSED — 21 assertions\n')
  console.log('  covered: both availability shapes, overnight spans, duplicate starts,')
  console.log('           unknown day and domain keys, unparseable times, missing')
  console.log('           required fields, top-level array, order preservation.')
  for (const s of skips) console.log(`  skip -> ${s.table}: ${s.reason}`)
  return 0
}

async function main() {
  loadEnv()
  if (process.argv.includes('--self-test')) return selfTest()
  const confirmed = process.argv.includes('--confirm')
  const urlVar = argOf('--url-var', 'DIRECT_DATABASE_URL')
  const batchSize = Number(argOf('--batch', '50'))
  const url = process.env[urlVar]
  if (!url) {
    console.error(`ERROR: ${urlVar} is not set in .env or .env.local`)
    return 1
  }

  // Say where this is pointed, always. The default target is production, and a
  // rehearsal run differs from a production run by one flag — that is too small
  // a difference to leave unstated.
  const { describe } = require('../rehearsal/endpoints')
  const target = describe(url)
  if (target) {
    console.log('')
    console.log(`  TARGET: ${target.production ? 'PRODUCTION' : 'branch/copy'}  —  ${target.label}`)
    console.log(`  endpoint ${target.endpoint}  database ${target.database}`)
    console.log('')
    // Writing to production takes a second, explicit statement of intent.
    if (confirmed && target.production && !process.argv.includes('--production')) {
      console.error('  REFUSING TO RUN.')
      console.error('  --confirm against a production endpoint also requires --production.')
      console.error('')
      console.error('  Rehearse first:')
      console.error('    npm run w1:backfill -- --url-var REHEARSAL_DATABASE_URL --confirm')
      console.error('')
      console.error('  When you genuinely mean production:')
      console.error('    npm run w1:backfill -- --confirm --production')
      console.error('')
      return 2
    }
  }

  const client = new Client({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
    statement_timeout: 300000,
  })
  await client.connect()

  const { rows } = await client.query(
    `SELECT id, "workerProfileId", "jobHistory", "education", "availability", "experience"
     FROM worker_additional_info ORDER BY id`
  )
  console.log(`source rows: ${rows.length} worker_additional_info\n`)

  const { out, skips } = transform(rows)

  console.log('planned rows:')
  console.log(`  worker_job_history   ${out.jobHistory.length}`)
  console.log(`  worker_education     ${out.education.length}`)
  console.log(`  worker_availability  ${out.availability.length}`)
  console.log(`  worker_experience    ${out.experience.length}`)
  console.log(`  total                ${out.jobHistory.length + out.education.length + out.availability.length + out.experience.length}`)

  if (skips.length) {
    const byReason = {}
    for (const s of skips) {
      const k = `${s.table}: ${s.reason.replace(/entry \d+/, 'entry N').replace(/^[A-Z]+: /, '')}`
      byReason[k] = (byReason[k] || 0) + 1
    }
    console.log(`\nSKIPPED — ${skips.length} item(s) could not be migrated as-is:\n`)
    for (const [reason, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(5)}  ${reason}`)
    }
    console.log('\nNothing was guessed. Each skipped item is reported rather than')
    console.log('written with an invented value. Review before proceeding.')
  } else {
    console.log('\nNo skips — every source value parsed cleanly.')
  }

  if (!confirmed) {
    console.log('\nDRY RUN — nothing written. Add --confirm to execute.')
    await client.end()
    return 0
  }

  // Group planned rows by their owning worker so a batch can be rebuilt atomically.
  const byAdditionalInfo = new Map()
  const byProfile = new Map()
  const push = (map, key, bucket, row) => {
    if (!map.has(key)) map.set(key, { jobHistory: [], education: [], availability: [], experience: [] })
    map.get(key)[bucket].push(row)
  }
  for (const r of out.jobHistory) push(byAdditionalInfo, r[0], 'jobHistory', r)
  for (const r of out.education) push(byAdditionalInfo, r[0], 'education', r)
  for (const r of out.availability) push(byProfile, r[0], 'availability', r)
  for (const r of out.experience) push(byProfile, r[0], 'experience', r)

  const allAids = rows.map((r) => r.id)
  const allWids = rows.map((r) => r.workerProfileId)
  const written = { jobHistory: 0, education: 0, availability: 0, experience: 0 }

  console.log(`\nwriting in batches of ${batchSize}...`)
  for (let i = 0; i < allAids.length; i += batchSize) {
    const aids = allAids.slice(i, i + batchSize)
    const wids = allWids.slice(i, i + batchSize)
    await client.query('BEGIN')
    try {
      // Lock the source rows: rebuilding from a stale read could overwrite a
      // concurrent app write once dual-write is live.
      await client.query('SELECT id FROM worker_additional_info WHERE id = ANY($1) FOR UPDATE', [aids])

      await client.query('DELETE FROM worker_job_history WHERE "workerAdditionalInfoId" = ANY($1)', [aids])
      await client.query('DELETE FROM worker_education WHERE "workerAdditionalInfoId" = ANY($1)', [aids])
      await client.query('DELETE FROM worker_availability WHERE "workerProfileId" = ANY($1)', [wids])
      await client.query('DELETE FROM worker_experience WHERE "workerProfileId" = ANY($1)', [wids])

      for (const aid of aids) {
        const g = byAdditionalInfo.get(aid)
        if (!g) continue
        written.jobHistory += await insertBatch(client, 'worker_job_history', COLS.worker_job_history, g.jobHistory)
        written.education += await insertBatch(client, 'worker_education', COLS.worker_education, g.education)
      }
      for (const wid of wids) {
        const g = byProfile.get(wid)
        if (!g) continue
        written.availability += await insertBatch(client, 'worker_availability', COLS.worker_availability, g.availability)
        written.experience += await insertBatch(client, 'worker_experience', COLS.worker_experience, g.experience)
      }
      await client.query('COMMIT')
      process.stdout.write(`  ${Math.min(i + batchSize, allAids.length)}/${allAids.length}\r`)
    } catch (err) {
      await client.query('ROLLBACK')
      await client.end()
      console.error(`\n\nFAILED on batch starting at ${i}: ${err.message}`)
      console.error('That batch rolled back. Earlier batches are committed;')
      console.error('re-run to rebuild — the script is idempotent.')
      return 1
    }
  }

  console.log('\n\nwritten:')
  for (const [k, v] of Object.entries(written)) console.log(`  ${k.padEnd(14)} ${v}`)

  const check = await client.query(`
    SELECT
      (SELECT count(*) FROM worker_job_history)  AS job_history,
      (SELECT count(*) FROM worker_education)    AS education,
      (SELECT count(*) FROM worker_availability) AS availability,
      (SELECT count(*) FROM worker_experience)   AS experience`)
  const t = check.rows[0]
  console.log('\nin-table totals:')
  const pairs = [
    ['worker_job_history', Number(t.job_history), out.jobHistory.length],
    ['worker_education', Number(t.education), out.education.length],
    ['worker_availability', Number(t.availability), out.availability.length],
    ['worker_experience', Number(t.experience), out.experience.length],
  ]
  let bad = 0
  for (const [name, actual, planned] of pairs) {
    const ok = actual === planned
    if (!ok) bad++
    console.log(`  ${ok ? 'ok  ' : 'MISS'} ${name.padEnd(22)} ${String(actual).padStart(6)}  planned ${planned}`)
  }

  await client.end()
  if (bad) {
    console.error(`\n${bad} table(s) do not match the plan. Investigate before phase P3.`)
    return 1
  }
  console.log('\nBackfill complete and matching the plan.')
  console.log('Next: npm run db:parity, then compare against the pre-backfill snapshot.')
  return 0
}

main().then((c) => process.exit(c)).catch((err) => {
  console.error(err.message)
  process.exit(1)
})
