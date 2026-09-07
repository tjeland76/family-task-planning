import { describe, expect, it } from "vitest";
import { buildDueTodaySummaries } from "@/lib/notifications/rules";
import { getTodayInFamilyTimezone } from "@/lib/notifications/due-today";

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

describe("getTodayInFamilyTimezone (DST correctness)", () => {
  it("uses the UTC date directly in winter (GMT, UTC+0)", () => {
    expect(getTodayInFamilyTimezone(new Date("2026-01-15T23:30:00Z"))).toBe("2026-01-15");
  });

  it("rolls over to the next day late in the evening during BST (UTC+1)", () => {
    // 23:30 UTC in July is 00:30 the next day in London -- a naive UTC-date
    // read would get this wrong.
    expect(getTodayInFamilyTimezone(new Date("2026-07-15T23:30:00Z"))).toBe("2026-07-16");
  });
});
