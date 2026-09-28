// Reads the three G-NAF tables the suburb list needs from an unzipped release.
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readPsv } from './psv.js'
import type { Centroid, GnafLocality } from './select.js'

export interface GnafRelease {
  localities: GnafLocality[]
  centroids: Map<string, Centroid>
  addressPostcodes: Map<string, Map<string, number>>
  addressesRead: number
}

const STATES = ['ACT', 'NSW', 'NT', 'OT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'] as const

/** Finds the `Standard` folder (holding NSW_LOCALITY_psv.psv etc.) at or below `src`. */
export async function findStandardDir(src: string, depth = 4): Promise<string> {
  const entries = await readdir(src, { withFileTypes: true })
  if (entries.some((e) => e.isFile() && /^[A-Z]+_LOCALITY_psv\.psv$/.test(e.name))) return src
  if (depth > 0) {
    for (const e of entries) {
      if (!e.isDirectory()) continue
      try {
        return await findStandardDir(join(src, e.name), depth - 1)
      } catch {
        // keep looking
      }
    }
  }
  throw new Error(`no G-NAF Standard folder (*_LOCALITY_psv.psv) under ${src}`)
}

export async function readRelease(src: string, log: (m: string) => void = () => {}): Promise<GnafRelease> {
  const dir = await findStandardDir(src)
  const present = new Set(await readdir(dir))
  const localities: GnafLocality[] = []
  const centroids = new Map<string, Centroid>()
  const addressPostcodes = new Map<string, Map<string, number>>()
  let addressesRead = 0

  for (const state of STATES) {
    const file = (t: string) => `${state}_${t}_psv.psv`
    const tables = ['LOCALITY', 'LOCALITY_POINT', 'ADDRESS_DETAIL'].map(file)
    const missing = tables.filter((t) => !present.has(t))
    if (missing.length === 3) continue // a fixture may cover only some states
    if (missing.length > 0) throw new Error(`${state}: missing ${missing.join(', ')}`)

    // The state comes from the file name. STATE_PID must agree within a file;
    // a mixed file means the release layout changed and the mapping is unsafe.
    const statePids = new Set<string>()
    for await (const r of readPsv(join(dir, file('LOCALITY')), [
      'LOCALITY_PID', 'LOCALITY_NAME', 'PRIMARY_POSTCODE', 'LOCALITY_CLASS_CODE', 'STATE_PID', 'DATE_RETIRED',
    ])) {
      if (r.DATE_RETIRED) continue
      statePids.add(r.STATE_PID as string)
      localities.push({
        localityPid: r.LOCALITY_PID as string,
        name: r.LOCALITY_NAME as string,
        primaryPostcode: r.PRIMARY_POSTCODE as string,
        classCode: r.LOCALITY_CLASS_CODE as string,
        state,
      })
    }
    if (statePids.size > 1) throw new Error(`${file('LOCALITY')}: more than one STATE_PID (${[...statePids].join(', ')})`)

    for await (const r of readPsv(join(dir, file('LOCALITY_POINT')), ['LOCALITY_PID', 'LATITUDE', 'LONGITUDE', 'DATE_RETIRED'])) {
      if (r.DATE_RETIRED) continue
      const pid = r.LOCALITY_PID as string
      if (centroids.has(pid)) throw new Error(`${file('LOCALITY_POINT')}: two current points for ${pid}`)
      centroids.set(pid, { latitude: Number(r.LATITUDE), longitude: Number(r.LONGITUDE) })
    }

    log(`${state}: reading addresses`)
    for await (const r of readPsv(join(dir, file('ADDRESS_DETAIL')), ['LOCALITY_PID', 'POSTCODE', 'ALIAS_PRINCIPAL', 'DATE_RETIRED'])) {
      addressesRead++
      if (r.DATE_RETIRED || r.ALIAS_PRINCIPAL !== 'P') continue
      const pid = r.LOCALITY_PID as string
      let m = addressPostcodes.get(pid)
      if (!m) addressPostcodes.set(pid, (m = new Map()))
      const pc = r.POSTCODE as string
      m.set(pc, (m.get(pc) ?? 0) + 1)
    }
  }
  if (localities.length === 0) throw new Error(`no localities read from ${dir}`)
  return { localities, centroids, addressPostcodes, addressesRead }
}
