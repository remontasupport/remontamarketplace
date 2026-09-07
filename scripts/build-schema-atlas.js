/**
 * Generates the Schema Atlas artifact FROM prisma/schema.target.prisma,
 * so the visual can never drift from the schema it documents.
 *
 *   node scripts/build-schema-atlas.js
 *
 * Parses models, fields, types and comments; overlays curated row counts and
 * change badges; writes aidlc-docs/inception/application-design/schema-final.html
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'prisma', 'schema.target.prisma')
const OUT = path.join(ROOT, 'aidlc-docs', 'inception', 'application-design', 'schema-final.html')

// ---------------------------------------------------------------- parse ----
const raw = fs.readFileSync(SRC, 'utf8')

function parseBlocks(kind) {
  const out = []
  const re = new RegExp(`^${kind}\\s+(\\w+)\\s*\\{([\\s\\S]*?)^\\}`, 'gm')
  let m
  while ((m = re.exec(raw))) {
    const start = raw.lastIndexOf('\n\n', m.index)
    const preamble = raw.slice(start === -1 ? 0 : start, m.index)
    const doc = preamble.split('\n').filter(l => l.trim().startsWith('///'))
      .map(l => l.replace(/^\s*\/\/\/\s?/, '').trim()).join(' ')
    out.push({ name: m[1], body: m[2], doc })
  }
  return out
}

const enums = parseBlocks('enum').map(e => ({
  name: e.name,
  doc: e.doc,
  values: e.body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('/')),
}))
const enumNames = new Set(enums.map(e => e.name))

const models = parseBlocks('model').map(mo => {
  const lines = mo.body.split('\n')
  const fields = []
  let pendingDoc = ''
  let map = null
  const indexes = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { continue }
    if (line.startsWith('///')) { pendingDoc += (pendingDoc ? ' ' : '') + line.replace(/^\/\/\/\s?/, ''); continue }
    if (line.startsWith('//')) { continue }
    if (line.startsWith('@@map')) { map = (line.match(/@@map\("([^"]+)"\)/) || [])[1]; continue }
    if (line.startsWith('@@')) { indexes.push(line); continue }

    const fm = line.match(/^(\w+)\s+(\S+)(.*)$/)
    if (!fm) { pendingDoc = ''; continue }
    const [, name, type, rest] = fm
    const inline = (rest.match(/\/\/\s?(.*)$/) || [])[1] || ''
    const base = type.replace(/[?\[\]]/g, '')
    fields.push({
      name, type,
      note: (pendingDoc + (pendingDoc && inline ? ' — ' : '') + inline).trim(),
      isRelation: !['String','Int','Float','Boolean','DateTime','Json','Bytes','Decimal','BigInt'].includes(base) && !enumNames.has(base),
      isEnum: enumNames.has(base),
      attrs: rest.replace(/\/\/.*$/, '').trim(),
    })
    pendingDoc = ''
  }
  return { name: mo.name, doc: mo.doc, map, fields, indexes }
})

// ------------------------------------------------------- curated overlay ----
const ROWS = {
  User:'1,746', ClientProfile:'32', CoordinatorProfile:'28',
  WorkerProfile:'1,680', WorkerAdditionalInfo:'374 → 1,680', WorkerBankAccount:'286',
  WorkerPhoto:'~1,600', WorkerJobHistory:'570', WorkerEducation:'395',
  WorkerAvailability:'~1,515', WorkerExperience:'832',
  WorkerServiceCategory:'3,214', WorkerServiceSubcategory:'~12,030',
  VerificationRequirement:'9,254',
  Participant:'45', FundingPlan:'0 — capture only',
  ServiceRequest:'21', ServiceRequestService:'21',
  ServiceRequestServiceSubcategory:'0 — new capability', ServiceRequestSchedule:'0 — new capability',
  ServiceRequestWorker:'14',
  Job:'230', JobApplication:'107',
  Category:'6', Subcategory:'43', Document:'26 → ~66',
  CategoryDocument:'107', SubcategoryDocument:'11',
  AuditLog:'12,262', Session:'0', Account:'0', VerificationToken:'—',
}
const NEW_MODELS = new Set(['WorkerBankAccount','WorkerPhoto','WorkerJobHistory','WorkerEducation',
  'WorkerAvailability','WorkerExperience','WorkerServiceCategory','WorkerServiceSubcategory',
  'FundingPlan','ServiceRequestService','ServiceRequestServiceSubcategory','ServiceRequestSchedule',
  'ServiceRequestWorker'])
const NEW_ENUMS = new Set(['Gender','EngagementType','PhotoType','DayOfWeek','CareDomain',
  'ScheduleFrequency','SchedulingMode','StartPreference','ServiceRequestWorkerStatus'])

// field-level change badges: "Model.field": "new" | "moved" | "type"
const BADGES = {
  'User.updatedAt':'type',
  'ClientProfile.id':'type','ClientProfile.streetAddress':'new','ClientProfile.suburb':'new',
  'ClientProfile.state':'new','ClientProfile.postalCode':'new',
  'CoordinatorProfile.id':'type','CoordinatorProfile.streetAddress':'new',
  'CoordinatorProfile.suburb':'new','CoordinatorProfile.state':'new','CoordinatorProfile.postalCode':'new',
  'WorkerProfile.setupAccountDetails':'new','WorkerProfile.setupCompliance':'new',
  'WorkerProfile.setupTrainings':'new','WorkerProfile.setupServices':'new',
  'WorkerProfile.verificationStatus':'type','WorkerProfile.updatedAt':'type',
  'WorkerAdditionalInfo.dateOfBirth':'moved','WorkerAdditionalInfo.gender':'moved',
  'WorkerAdditionalInfo.introduction':'moved','WorkerAdditionalInfo.languages':'moved',
  'WorkerAdditionalInfo.hasVehicle':'moved','WorkerAdditionalInfo.engagementType':'new',
  'WorkerServiceCategory.radiusKm':'new',
  'VerificationRequirement.documentId':'new','VerificationRequirement.reviewedById':'type',
  'Participant.userId':'type','Participant.ownerRole':'new','Participant.gender':'type',
  'Participant.relationshipToClient':'type',
  'ServiceRequest.requesterId':'type','ServiceRequest.description':'moved',
  'ServiceRequest.specialRequirements':'moved','ServiceRequest.scheduleNotes':'moved',
  'ServiceRequest.preferredWorkerGender':'moved','ServiceRequest.preferredLanguages':'new',
  'ServiceRequest.requiredCareDomains':'new','ServiceRequest.frequency':'moved',
  'ServiceRequest.schedulingMode':'moved','ServiceRequest.startPreference':'moved',
  'ServiceRequest.hoursPerPeriod':'moved','ServiceRequest.sessionsPerPeriod':'moved',
  'ServiceRequest.startDate':'moved','ServiceRequest.latitude':'new','ServiceRequest.longitude':'new',
  'JobApplication.workerProfileId':'type',
  'Document.description':'type',
}

// removed columns, shown struck through so nothing silently vanishes
const REMOVED = {
  WorkerProfile:[
    ['age','Int?','Derived from dateOfBirth and drifted in 287 of 912 rows'],
    ['dateOfBirth','String?','→ WorkerAdditionalInfo, as DateTime'],
    ['gender','String?','→ WorkerAdditionalInfo, as Gender'],
    ['photos','String?','→ WorkerPhoto relation'],
    ['additionalPhotos','String?','→ WorkerPhoto relation. Was a JSON array inside a String'],
    ['setupProgress','Json?','→ four boolean columns'],
    ['profileCompleted','Boolean','Now derived: all four setup flags true'],
    ['abn','Json?','→ engagementType. Held exactly one key'],
    ['experience / introduction / languages','—','→ WorkerAdditionalInfo'],
    ['uniqueService','String?','AD-17 — dropped, not migrated · 574 workers (34%)'],
    ['funFact','String?','AD-17 — dropped, not migrated · 435 workers (26%)'],
    ['hobbies','String?','AD-17 — dropped, not migrated · ≥280 workers, remainder unmeasured'],
    ['qualifications','String?','AD-17 — dropped, not migrated · 123 workers (7%)'],
  ],
  WorkerAdditionalInfo:[
    ['jobHistory','Json?','→ WorkerJobHistory · 570 rows'],
    ['education','Json?','→ WorkerEducation · 395 rows'],
    ['availability','Json?','→ WorkerAvailability · ~1,515 rows'],
    ['experience','Json?','→ WorkerExperience · 832 rows'],
    ['bankAccount','Json?','→ WorkerBankAccount, encrypted · 286 rows'],
    ['uniqueService','String[]','AD-17 — dropped. Duplicated on WorkerProfile; 39 conflicting pairs no longer need a rule'],
    ['funFact','String?','AD-17 — dropped. Duplicated on WorkerProfile; 18 conflicting pairs no longer need a rule'],
  ],
  WorkerServiceCategory:[
    ['categoryName','String','Denormalised copy — search filtered on this, not the id'],
    ['subcategoryIds / subcategoryNames','String[]','Parallel arrays related only by position'],
  ],
  Participant:[
    ['location','String?','100% NULL across all 45 participants — never used'],
    ['servicesRequested','Json?','ServiceRequest.services is the real home'],
    ['isSelfManaged (on ClientProfile)','Boolean','Consolidated here — 3 of 26 pairs disagreed'],
  ],
  ServiceRequest:[
    ['services','Json','→ ServiceRequestService · was keyed by Category slug ids'],
    ['details','Json','→ 12 typed columns'],
    ['selectedWorkers','String[]','→ ServiceRequestWorker'],
    ['assignedWorker','Json?','→ ServiceRequestWorker, status ASSIGNED. n8n is not in use'],
  ],
}

const DOMAINS = [
  { id:'d-identity',    title:'Identity & accounts', models:['User','ClientProfile','CoordinatorProfile'] },
  { id:'d-worker',      title:'Worker', models:['WorkerProfile','WorkerAdditionalInfo','WorkerPhoto',
                          'WorkerBankAccount','WorkerJobHistory','WorkerEducation','WorkerAvailability','WorkerExperience'] },
  { id:'d-services',    title:'Service taxonomy', models:['WorkerServiceCategory','WorkerServiceSubcategory',
                          'Category','Subcategory','Document','CategoryDocument','SubcategoryDocument'] },
  { id:'d-compliance',  title:'Compliance', models:['VerificationRequirement'] },
  { id:'d-demand',      title:'Participants & service requests', models:['Participant','FundingPlan','ServiceRequest',
                          'ServiceRequestService','ServiceRequestServiceSubcategory','ServiceRequestSchedule','ServiceRequestWorker'] },
  { id:'d-system',      title:'Recruitment & system', models:['Job','JobApplication','AuditLog','Session','Account','VerificationToken'] },
]

// ----------------------------------------------------------------- emit ----
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const byName = Object.fromEntries(models.map(m => [m.name, m]))
const BADGE = { new:['b-new','New'], moved:['b-moved','Moved'], type:['b-type','Retyped'], drop:['b-drop','Removed'] }

function renderModel(name) {
  const m = byName[name]
  if (!m) return ''
  const scalars = m.fields.filter(f => !f.isRelation)
  const rels = m.fields.filter(f => f.isRelation)
  const removed = REMOVED[name] || []
  const rows = [
    ...scalars.map(f => {
      const b = BADGES[`${name}.${f.name}`]
      return `<tr class="${b ? 'chg' : ''}">
        <td class="col">${esc(f.name)}</td>
        <td class="bd">${b ? `<span class="badge ${BADGE[b][0]}">${BADGE[b][1]}</span>` : ''}</td>
        <td class="ty">${esc(f.type)}</td>
        <td class="nt">${esc(f.note)}</td></tr>`
    }),
    ...removed.map(([c, t, n]) => `<tr class="chg row-drop">
        <td class="col">${esc(c)}</td>
        <td class="bd"><span class="badge b-drop">Removed</span></td>
        <td class="ty">${esc(t)}</td>
        <td class="nt">${esc(n)}</td></tr>`),
  ].join('')
  return `<section class="model${NEW_MODELS.has(name) ? ' is-new' : ''}">
    <div class="mhead">
      <span class="mname">${esc(name)}</span>
      ${m.map ? `<span class="mmap">@@map("${esc(m.map)}")</span>` : ''}
      ${NEW_MODELS.has(name) ? '<span class="badge b-new">New model</span>' : ''}
      <span class="mrows">${esc(ROWS[name] || '—')} rows</span>
      ${m.doc ? `<div class="mnote">${esc(m.doc)}</div>` : ''}
      ${rels.length ? `<div class="rels">${rels.map(r =>
        `<span class="rel">${esc(r.name)} <em>${esc(r.type)}</em></span>`).join('')}</div>` : ''}
    </div>
    <div class="tw"><table>
      <thead><tr><th>Column</th><th></th><th>Type</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </section>`
}

const enumCards = enums.map(e => `<div class="enum${NEW_ENUMS.has(e.name) ? ' is-new' : ''}">
    <div class="ename">${esc(e.name)} ${NEW_ENUMS.has(e.name) ? '<span class="badge b-new">New</span>' : ''}</div>
    <div class="evals">${e.values.map(esc).join(' · ')}</div>
    ${e.doc ? `<div class="evals dim">${esc(e.doc)}</div>` : ''}
  </div>`).join('')

const body = DOMAINS.map(d => `<h2 class="domain" id="${d.id}">${esc(d.title)}</h2>
  ${d.models.map(renderModel).join('')}`).join('')

const counts = {
  models: models.length,
  newModels: models.filter(m => NEW_MODELS.has(m.name)).length,
  enums: enums.length,
  newEnums: enums.filter(e => NEW_ENUMS.has(e.name)).length,
  json: (raw.match(/^\s+\w+\s+Json/gm) || []).length,
}

const html = fs.readFileSync(path.join(__dirname, 'atlas-template.html'), 'utf8')
  .replace('{{ENUMS}}', enumCards)
  .replace('{{MODELS}}', body)
  .replace('{{C_MODELS}}', counts.models)
  .replace('{{C_NEW}}', counts.newModels)
  .replace('{{C_ENUMS}}', counts.enums)
  .replace('{{C_NEWENUMS}}', counts.newEnums)
  .replace('{{C_JSON}}', counts.json)
  .replace('{{NAV}}', DOMAINS.map(d => `<button class="pill" data-jump="${d.id}">${esc(d.title)}</button>`).join(''))

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, html, 'utf8')
console.log(`Wrote ${path.relative(ROOT, OUT)}`)
console.log(`  ${counts.models} models (${counts.newModels} new), ${counts.enums} enums (${counts.newEnums} new), ${counts.json} Json columns remaining`)
