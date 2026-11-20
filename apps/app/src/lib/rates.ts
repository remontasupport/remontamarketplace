// worker-rates (2026-11-20): how a worker's rates read on the admin screens (Show profile, the dashboard cards).
import { RATE_NAMES, type RateName, type RatesView } from "@remonta/api-contract";

/** The labels and units, in page order. */
export const RATE_ROWS: Record<RateName, { label: string; unit: string; short: string }> = {
  weekday: { label: "Weekdays", unit: "per hour", short: "/hr" },
  saturday: { label: "Saturdays", unit: "per hour", short: "/hr" },
  sunday: { label: "Sundays", unit: "per hour", short: "/hr" },
  publicHoliday: { label: "Public Holidays", unit: "per hour", short: "/hr" },
  evening: { label: "Evenings", unit: "per hour", short: "/hr" },
  inactiveSleepover: { label: "Inactive Sleepovers", unit: "per night", short: "/night" },
};

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
export const formatRate = (dollars: number): string => money.format(dollars);

/** The saved rates in page order (none saved = empty). */
export const savedRates = (rates: RatesView | null | undefined): { name: RateName; amount: number }[] =>
  rates ? RATE_NAMES.flatMap((name) => (rates[name] === null ? [] : [{ name, amount: rates[name] }])) : [];
