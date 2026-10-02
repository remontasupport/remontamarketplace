// The clock as a dependency, so a use case can be run at a chosen instant under
// test (expired tickets, the photo claim window, the notice window) and reads the
// time once per request rather than once per line.
export type Clock = () => Date

export const systemClock: Clock = () => new Date()
