import { afterEach, describe, expect, it, vi } from "vitest";
import { formatShortDate, isValidIsoDate, localToday } from "./dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("date utilities", () => {
  it("formats the current local date as an ISO date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 19, 1));

    expect(localToday()).toBe("2026-11-03");
  });

  it("accepts real calendar dates and rejects invalid dates", () => {
    expect(isValidIsoDate("2026-11-03")).toBe(true);
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2026-11-3")).toBe(false);
  });

  it("formats stored dates consistently for expense and settlement history", () => {
    expect(formatShortDate("2026-11-03")).toBe("Nov 3, 2026");
  });
});
