import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from './csv'

describe('csv', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('Smith, Jr')).toBe('"Smith, Jr"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
  })

  it('neutralises a formula but keeps a phone number', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvCell('-2+3')).toBe("'-2+3")
    expect(csvCell('+61 412 345 678')).toBe('+61 412 345 678')
    expect(csvCell('0412345678')).toBe('0412345678')
  })

  it('writes the header and rows with CRLF line ends', () => {
    expect(toCsv(['First name', 'Email'], [['Ann', 'ann@x.au'], ['Bo', 'bo@x.au']])).toBe('First name,Email\r\nAnn,ann@x.au\r\nBo,bo@x.au\r\n')
  })
})
