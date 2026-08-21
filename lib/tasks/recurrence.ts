export type Recurrence = "never" | "daily" | "weekly" | "monthly" | "yearly";

/**
 * Computes the next due date for a recurring task, given the date the
 * completed occurrence was due on. Returns null for "never" (no next
 * occurrence should be created).
 *
 * Operates on date-only strings (YYYY-MM-DD) to match the `due_date`
 * column's DATE type and avoid timezone drift from Date-object arithmetic.
 */
export function computeNextDueDate(
  dueDate: string,
  recurrence: Recurrence,
): string | null {
  if (recurrence === "never") return null;

  const [year, month, day] = dueDate.split("-").map(Number);

  if (recurrence === "daily" || recurrence === "weekly") {
    const next = new Date(Date.UTC(year, month - 1, day));
    next.setUTCDate(next.getUTCDate() + (recurrence === "daily" ? 1 : 7));
    return next.toISOString().slice(0, 10);
  }

  // Monthly/yearly: advance the month/year, then clamp the day to the target
  // month's actual length so e.g. 31 Jan -> 28/29 Feb instead of JS's default
  // date-overflow rollover into March.
  const targetYear = recurrence === "yearly" ? year + 1 : year + Math.floor(month / 12);
  const targetMonth = recurrence === "yearly" ? month : (month % 12) + 1;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth - 1, clampedDay))
    .toISOString()
    .slice(0, 10);
}
