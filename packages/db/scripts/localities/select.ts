// Which G-NAF localities become au_localities rows. Pure: build.ts streams the files
// into these inputs, so the rule can be tested without a 2 GB download.
//
// THE RULE
//   1. A locality with principal addresses gets one row per distinct postcode used
//      by those addresses, whatever its class. Real addresses mean a real place.
//      Alias addresses and retired addresses are not counted: an alias can carry a
//      postcode the principal does not, and would invent a pair nobody lives in.
//   2. A locality with no addresses is kept only if it is GAZETTED (class G) and its
//      PRIMARY_POSTCODE is plausible for its state. That value is unreliable
//      (Gungahlin ACT carries 9999, an unnamed QLD locality 9998), so every row kept this way is listed in the
//      report for review.
//   3. Everything else is dropped with a reason: Indigenous locations, districts,
//      hundreds, topographic and unofficial names with no addresses, and
//      localities with no usable postcode or centroid.
import { displayName, searchName } from './names.js'
import { roundCoord, type LocalityRow } from './csv.js'

export interface GnafLocality {
  localityPid: string
  name: string
  primaryPostcode: string
  classCode: string
  state: string
}

export interface Centroid {
  latitude: number
  longitude: number
}

export type DropReason =
  | 'no-addresses-not-gazetted'
  | 'no-addresses-no-plausible-postcode'
  | 'no-centroid'
  | 'centroid-out-of-bounds'

export interface SelectionReport {
  localities: number
  rows: number
  keptByClass: Record<string, number>
  droppedByReason: Record<DropReason, number>
  droppedByClass: Record<string, number>
  /** Rows kept by rule 2 -- review these. */
  primaryPostcodeFallbacks: { localityPid: string; suburb: string; state: string; postcode: string }[]
  /** Localities whose addresses use more than one postcode. */
  multiPostcode: { localityPid: string; suburb: string; state: string; postcodes: string[] }[]
  invalidAddressPostcodes: { localityPid: string; postcode: string; addresses: number }[]
}

const POSTCODE = /^[0-9]{4}$/

// Leading digits of real postcodes per state (Australia Post ranges), used only to
// sanity-check rule 2's fallback. OT covers Jervis Bay (25xx), Norfolk (2899),
// Christmas and Cocos (679x).
const STATE_POSTCODE_PREFIX: Record<string, RegExp> = {
  NSW: /^(1|2)/,
  ACT: /^(02|26|29)/,
  VIC: /^(3|8)/,
  QLD: /^(4|9)/,
  SA: /^5/,
  WA: /^6/,
  TAS: /^7/,
  NT: /^08/,
  OT: /^(25|28|67)/,
}

// Values G-NAF uses where a locality has no real postcode: Gungahlin and Belconnen
// ACT carry 9999, "Unnamed Locality" QLD carries 9998 (Aug 2026 release).
const PLACEHOLDER_POSTCODES = new Set(['0000', '9998', '9999'])

export function plausiblePostcode(state: string, postcode: string): boolean {
  if (!POSTCODE.test(postcode) || PLACEHOLDER_POSTCODES.has(postcode)) return false
  return STATE_POSTCODE_PREFIX[state]?.test(postcode) ?? false
}

// Same bounds as the au_localities CHECK constraints.
function inBounds(c: Centroid): boolean {
  return c.latitude >= -55 && c.latitude <= -9 && c.longitude >= 72 && c.longitude <= 169
}

export function selectLocalities(
  localities: readonly GnafLocality[],
  centroids: ReadonlyMap<string, Centroid>,
  /** localityPid -> postcode -> number of current principal addresses */
  addressPostcodes: ReadonlyMap<string, ReadonlyMap<string, number>>,
): { rows: LocalityRow[]; report: SelectionReport } {
  const rows: LocalityRow[] = []
  const report: SelectionReport = {
    localities: localities.length,
    rows: 0,
    keptByClass: {},
    droppedByReason: {
      'no-addresses-not-gazetted': 0,
      'no-addresses-no-plausible-postcode': 0,
      'no-centroid': 0,
      'centroid-out-of-bounds': 0,
    },
    droppedByClass: {},
    primaryPostcodeFallbacks: [],
    multiPostcode: [],
    invalidAddressPostcodes: [],
  }
  const drop = (l: GnafLocality, reason: DropReason) => {
    report.droppedByReason[reason]++
    report.droppedByClass[l.classCode] = (report.droppedByClass[l.classCode] ?? 0) + 1
  }

  for (const l of localities) {
    const suburb = displayName(l.name)
    const centroid = centroids.get(l.localityPid)
    if (!centroid) {
      drop(l, 'no-centroid')
      continue
    }
    const point = { latitude: roundCoord(centroid.latitude), longitude: roundCoord(centroid.longitude) }
    if (!inBounds(point)) {
      drop(l, 'centroid-out-of-bounds')
      continue
    }

    const counts = addressPostcodes.get(l.localityPid)
    let postcodes: string[]
    if (counts && counts.size > 0) {
      postcodes = []
      for (const [pc, n] of counts) {
        if (POSTCODE.test(pc)) postcodes.push(pc)
        else report.invalidAddressPostcodes.push({ localityPid: l.localityPid, postcode: pc, addresses: n })
      }
      postcodes.sort()
      if (postcodes.length > 1) {
        report.multiPostcode.push({ localityPid: l.localityPid, suburb, state: l.state, postcodes })
      }
      if (postcodes.length === 0) {
        drop(l, 'no-addresses-no-plausible-postcode')
        continue
      }
    } else if (l.classCode !== 'G') {
      drop(l, 'no-addresses-not-gazetted')
      continue
    } else if (plausiblePostcode(l.state, l.primaryPostcode)) {
      postcodes = [l.primaryPostcode]
      report.primaryPostcodeFallbacks.push({ localityPid: l.localityPid, suburb, state: l.state, postcode: l.primaryPostcode })
    } else {
      drop(l, 'no-addresses-no-plausible-postcode')
      continue
    }

    report.keptByClass[l.classCode] = (report.keptByClass[l.classCode] ?? 0) + 1
    for (const postcode of postcodes) {
      rows.push({ localityPid: l.localityPid, state: l.state, suburb, searchName: searchName(l.name), postcode, ...point })
    }
  }
  report.rows = rows.length
  return { rows, report }
}
