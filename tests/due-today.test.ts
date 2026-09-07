import { describe, expect, it } from "vitest";
import { buildDueTodaySummaries } from "@/lib/notifications/rules";
import { isReminderHour } from "@/lib/notifications/due-today";

const TODAY = "2026-08-20";

describe("buildDueTodaySummaries", () => {
  it("collapses multiple tasks for the same assignee into one summary", () => {
    const summaries = buildDueTodaySummaries(
      [
        { title: "Task 1", assignedTo: "mum", status: "todo", dueDate: TODAY },
        { title: "Task 2", assignedTo: "mum", status: "todo", dueDate: TODAY },
        { title: "Task 3", assignedTo: "mum", status: "todo", dueDate: TODAY },
      ],
      TODAY,
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ familyMemberId: "mum", taskCount: 3 });
  });

  it("excludes completed tasks", () => {
    const summaries = buildDueTodaySummaries(
      [{ title: "Done already", assignedTo: "dad", status: "done", dueDate: TODAY }],
      TODAY,
    );

    expect(summaries).toHaveLength(0);
  });

  it("excludes unassigned tasks", () => {
    const summaries = buildDueTodaySummaries(
      [{ title: "Nobody's yet", assignedTo: null, status: "todo", dueDate: TODAY }],
      TODAY,
    );

    expect(summaries).toHaveLength(0);
  });

  it("excludes tasks not due today", () => {
    const summaries = buildDueTodaySummaries(
      [{ title: "Next week", assignedTo: "dad", status: "todo", dueDate: "2026-08-27" }],
      TODAY,
    );

    expect(summaries).toHaveLength(0);
  });
});

describe("isReminderHour (DST correctness)", () => {
  it("is true at 08:00 UTC in January (GMT, UTC+0 -> 8am London)", () => {
    expect(isReminderHour(new Date("2026-01-15T08:00:00Z"))).toBe(true);
  });

  it("is true at 07:00 UTC in July (BST, UTC+1 -> 8am London)", () => {
    expect(isReminderHour(new Date("2026-07-15T07:00:00Z"))).toBe(true);
  });

  it("is false at 08:00 UTC in July (BST, UTC+1 -> 9am London, not 8am)", () => {
    expect(isReminderHour(new Date("2026-07-15T08:00:00Z"))).toBe(false);
  });

  it("is false outside the reminder hour entirely", () => {
    expect(isReminderHour(new Date("2026-01-15T14:00:00Z"))).toBe(false);
  });
});
