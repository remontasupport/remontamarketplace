import { describe, expect, it } from "vitest";
import { formatRate, savedRates } from "./rates";

describe("rates on the admin screens", () => {
  it("lists the saved rates in page order and formats dollars", () => {
    const rates = { weekday: 45.5, saturday: null, sunday: 60, publicHoliday: null, evening: null, inactiveSleepover: 250, updatedAt: "2026-11-20T00:00:00.000Z" };
    expect(savedRates(rates)).toEqual([{ name: "weekday", amount: 45.5 }, { name: "sunday", amount: 60 }, { name: "inactiveSleepover", amount: 250 }]);
    expect(savedRates(null)).toEqual([]);
    expect(formatRate(45.5)).toBe("$45.50");
  });
});
