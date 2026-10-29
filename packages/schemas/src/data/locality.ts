// A suburb as people read it, written once for apps/app and apps/api (search-locations U4).

export interface LocalityName {
  suburb: string
  state: string
  postcode: string
}

/** "Parramatta, NSW 2150" (the profile label) or "Parramatta NSW 2150" (the autocomplete label). */
export function localityLabel(l: LocalityName, afterSuburb: ', ' | ' ' = ' '): string {
  return `${l.suburb}${afterSuburb}${l.state} ${l.postcode}`
}
