import { describe, expect, it } from "vitest";
import { computeNextDueDate } from "@/lib/tasks/recurrence";

describe("computeNextDueDate", () => {
  it("returns null for 'never'", () => {
    expect(computeNextDueDate("2026-08-20", "never")).toBeNull();
  });

  it("advances daily by one day", () => {
    expect(computeNextDueDate("2026-08-20", "daily")).toBe("2026-08-21");
  });

  it("advances weekly by seven days", () => {
    expect(computeNextDueDate("2026-08-20", "weekly")).toBe("2026-08-27");
  });

  it("rolls weekly over a month boundary", () => {
    expect(computeNextDueDate("2026-08-28", "weekly")).toBe("2026-09-04");
  });

  it("advances monthly, preserving the day of month", () => {
    expect(computeNextDueDate("2026-01-15", "monthly")).toBe("2026-02-15");
  });

  it("rolls monthly over a year boundary", () => {
    expect(computeNextDueDate("2026-12-10", "monthly")).toBe("2027-01-10");
  });

  it("clamps monthly to the shorter target month instead of overflowing", () => {
    // 2026 is not a leap year, so Feb has 28 days.
    expect(computeNextDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
  });

  it("clamps monthly into a leap-year February correctly", () => {
    expect(computeNextDueDate("2027-12-31", "monthly")).toBe("2028-01-31");
    expect(computeNextDueDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });

  it("advances yearly, preserving month and day", () => {
    expect(computeNextDueDate("2026-08-20", "yearly")).toBe("2027-08-20");
  });

  it("clamps a yearly Feb 29 anniversary into a non-leap year", () => {
    expect(computeNextDueDate("2028-02-29", "yearly")).toBe("2029-02-28");
  });
});
