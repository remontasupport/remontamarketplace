// A miniature G-NAF release, written as real PSV files with the real headers
// (copied from the August 2026 release), so the tests exercise the same reader
// the full build uses. Release A -> B covers every refresh case:
//   MELBOURNE       two postcodes in A (3000, 3004); B drops 3004 -> retired, successor 3000
//   MCMAHONS POINT  centroid moves in B -> updated in place
//   OLDTOWN         dropped by B -> retired, no successor
//   NEWESTATE       new in B -> inserted
// and every selection rule: alias and retired addresses ignored, an unofficial
// suburb with addresses kept, gazetted with no addresses kept on its primary
// postcode, an implausible primary postcode (9999) dropped, non-gazetted with no
// addresses dropped, no centroid dropped, a retired locality skipped.
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const LOCALITY_HEADER =
  'LOCALITY_PID|DATE_CREATED|DATE_RETIRED|LOCALITY_NAME|PRIMARY_POSTCODE|LOCALITY_CLASS_CODE|STATE_PID|GNAF_LOCALITY_PID|GNAF_RELIABILITY_CODE'
const POINT_HEADER = 'LOCALITY_POINT_PID|DATE_CREATED|DATE_RETIRED|LOCALITY_PID|PLANIMETRIC_ACCURACY|LONGITUDE|LATITUDE'
const ADDRESS_HEADER =
  'ADDRESS_DETAIL_PID|DATE_CREATED|DATE_LAST_MODIFIED|DATE_RETIRED|BUILDING_NAME|LOT_NUMBER_PREFIX|LOT_NUMBER|LOT_NUMBER_SUFFIX|FLAT_TYPE_CODE|FLAT_NUMBER_PREFIX|FLAT_NUMBER|FLAT_NUMBER_SUFFIX|LEVEL_TYPE_CODE|LEVEL_NUMBER_PREFIX|LEVEL_NUMBER|LEVEL_NUMBER_SUFFIX|NUMBER_FIRST_PREFIX|NUMBER_FIRST|NUMBER_FIRST_SUFFIX|NUMBER_LAST_PREFIX|NUMBER_LAST|NUMBER_LAST_SUFFIX|STREET_LOCALITY_PID|LOCATION_DESCRIPTION|LOCALITY_PID|ALIAS_PRINCIPAL|POSTCODE|PRIVATE_STREET|LEGAL_PARCEL_ID|CONFIDENCE|ADDRESS_SITE_PID|LEVEL_GEOCODED_CODE|PROPERTY_PID|GNAF_PROPERTY_PID|PRIMARY_SECONDARY'

interface FixtureLocality {
  pid: string
  name: string
  primaryPostcode?: string
  cls: string
  retired?: boolean
  point?: [lat: number, lng: number]
  /** [postcode, ALIAS_PRINCIPAL, retired?] per address */
  addresses?: [string, 'P' | 'A', boolean?][]
}

const STATE_PID: Record<string, string> = { NSW: '1', VIC: '2', QLD: '3', ACT: '8' }

function releaseA(): Record<string, FixtureLocality[]> {
  return {
    VIC: [
      {
        pid: 'locMEL', name: 'MELBOURNE', cls: 'G', point: [-37.814, 144.963],
        addresses: [['3000', 'P'], ['3000', 'P'], ['3000', 'P'], ['3004', 'P'], ['3004', 'P'], ['3006', 'A'], ['3141', 'P', true]],
      },
    ],
    NSW: [
      { pid: 'locMCM', name: 'MCMAHONS POINT', cls: 'G', point: [-33.846, 151.203], addresses: [['2060', 'P'], ['2060', 'P']] },
      { pid: 'locIND', name: 'GULARGAMBONE COMMUNITY', cls: 'I', point: [-31.33, 148.47] },
      { pid: 'locUNO', name: 'BONNY VIEW', cls: 'U', primaryPostcode: '2440', point: [-31.0, 152.8] },
      { pid: 'locUNA', name: 'SPRING FLAT', cls: 'U', point: [-32.6, 149.6], addresses: [['2850', 'P']] },
      { pid: 'locWJ', name: 'WEE JASPER', cls: 'G', primaryPostcode: '2582', point: [-35.13, 148.69] },
      { pid: 'locRET', name: 'OLD RETIRED', cls: 'G', retired: true, point: [-33.0, 150.0], addresses: [['2000', 'P']] },
      { pid: 'locNOPT', name: 'NO POINT', cls: 'G', addresses: [['2001', 'P']] },
    ],
    ACT: [
      { pid: 'locOC', name: "O'CONNOR", cls: 'G', point: [-35.26, 149.12], addresses: [['2602', 'P'], ['2602', 'P']] },
      { pid: 'locHALL', name: 'HALL', cls: 'G', primaryPostcode: '9999', point: [-35.17, 149.07] },
    ],
    QLD: [{ pid: 'locOLD', name: 'OLDTOWN', cls: 'G', point: [-27.47, 153.02], addresses: [['4000', 'P']] }],
  }
}

function releaseB(): Record<string, FixtureLocality[]> {
  const b = releaseA()
  const mel = b.VIC![0]!
  mel.addresses = mel.addresses!.filter(([pc]) => pc !== '3004')
  b.NSW![0]!.point = [-33.848, 151.205]
  b.QLD = [{ pid: 'locNEW', name: 'NEWESTATE', cls: 'G', point: [-27.5, 153.0], addresses: [['4001', 'P']] }]
  return b
}

export const FIXTURE_RELEASES = { A: releaseA, B: releaseB }

/** Writes a release to `<dir>/G-NAF/G-NAF FIXTURE/Standard/` and returns `dir`. */
export async function writeFixtureRelease(dir: string, which: keyof typeof FIXTURE_RELEASES): Promise<string> {
  const standard = join(dir, 'G-NAF', 'G-NAF FIXTURE', 'Standard')
  await mkdir(standard, { recursive: true })
  let addressSeq = 0
  for (const [state, localities] of Object.entries(FIXTURE_RELEASES[which]())) {
    const loc = [LOCALITY_HEADER]
    const pts = [POINT_HEADER]
    const adr = [ADDRESS_HEADER]
    for (const l of localities) {
      loc.push([l.pid, '2021-01-01', l.retired ? '2024-01-01' : '', l.name, l.primaryPostcode ?? '', l.cls, STATE_PID[state], '', '5'].join('|'))
      if (l.point) pts.push([`pt-${l.pid}`, '2021-01-01', '', l.pid, '', String(l.point[1]), String(l.point[0])].join('|'))
      for (const [postcode, ap, retired] of l.addresses ?? []) {
        const cells = new Array<string>(35).fill('')
        cells[0] = `GA${state}${++addressSeq}`
        cells[3] = retired ? '2024-01-01' : ''
        cells[24] = l.pid
        cells[25] = ap
        cells[26] = postcode
        adr.push(cells.join('|'))
      }
    }
    // CRLF, as the real files are.
    await writeFile(join(standard, `${state}_LOCALITY_psv.psv`), loc.join('\r\n') + '\r\n')
    await writeFile(join(standard, `${state}_LOCALITY_POINT_psv.psv`), pts.join('\r\n') + '\r\n')
    await writeFile(join(standard, `${state}_ADDRESS_DETAIL_psv.psv`), adr.join('\r\n') + '\r\n')
  }
  return dir
}
