import { describe, expect, it } from "vitest";
import { computeMemberWorkload, groupForMyTasks, groupForToday } from "@/lib/tasks/grouping";
import type { Task } from "@/lib/tasks/types";
import type { FamilyMember } from "@/lib/families/queries";

const TODAY = "2026-08-20";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? "Untitled",
    description: null,
    assignedTo: overrides.assignedTo ?? null,
    assigneeName: null,
    createdBy: "creator-1",
    categoryId: null,
    categoryName: null,
    dueDate: overrides.dueDate ?? null,
    status: overrides.status ?? "todo",
    recurrence: "never",
    completedAt: null,
    ...overrides,
  };
}

describe("groupForToday", () => {
  it("buckets overdue, today, and upcoming correctly", () => {
    const tasks = [
      makeTask({ id: "a", dueDate: "2026-08-19" }), // overdue
      makeTask({ id: "b", dueDate: TODAY }), // today
      makeTask({ id: "c", dueDate: "2026-08-27" }), // exactly 7 days out — upcoming
      makeTask({ id: "d", dueDate: "2026-08-28" }), // 8 days out — too far, excluded
      makeTask({ id: "e", dueDate: null }), // no due date — excluded from Today
      makeTask({ id: "f", dueDate: "2026-08-21", status: "done" }), // completed — excluded
    ];

    const groups = groupForToday(tasks, TODAY);

    expect(groups.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(groups.today.map((t) => t.id)).toEqual(["b"]);
    expect(groups.upcoming.map((t) => t.id)).toEqual(["c"]);
  });

  it("sorts each group by due date ascending", () => {
    const tasks = [
      makeTask({ id: "late", dueDate: "2026-08-10" }),
      makeTask({ id: "early", dueDate: "2026-08-05" }),
    ];

    const groups = groupForToday(tasks, TODAY);

    expect(groups.overdue.map((t) => t.id)).toEqual(["early", "late"]);
  });
});

describe("groupForMyTasks", () => {
  it("splits this-week from later at the boundary", () => {
    const tasks = [
      makeTask({ id: "overdue", dueDate: "2026-08-19" }),
      makeTask({ id: "today", dueDate: TODAY }),
      makeTask({ id: "this-week", dueDate: "2026-08-27" }), // exactly +7 days
      makeTask({ id: "later", dueDate: "2026-08-28" }), // +8 days
      makeTask({ id: "no-date", dueDate: null }),
      makeTask({ id: "done", dueDate: "2026-08-21", status: "done" }),
    ];

    const groups = groupForMyTasks(tasks, TODAY);

    expect(groups.overdue.map((t) => t.id)).toEqual(["overdue"]);
    expect(groups.today.map((t) => t.id)).toEqual(["today"]);
    expect(groups.thisWeek.map((t) => t.id)).toEqual(["this-week"]);
    expect(groups.later.map((t) => t.id)).toEqual(["later"]);
    expect(groups.noDueDate.map((t) => t.id)).toEqual(["no-date"]);
  });
});

describe("computeMemberWorkload", () => {
  const dad: FamilyMember = { id: "dad", displayName: "Dad", role: "parent" };
  const mum: FamilyMember = { id: "mum", displayName: "Mum", role: "parent" };

  it("counts outstanding and overdue tasks per member, with sample titles", () => {
    const tasks = [
      makeTask({ id: "1", assignedTo: "dad", dueDate: "2026-08-19", title: "Book dentist" }),
      makeTask({ id: "2", assignedTo: "dad", dueDate: "2026-08-25", title: "Renew insurance" }),
      makeTask({ id: "3", assignedTo: "dad", dueDate: "2026-08-26", title: "Book MOT" }),
      makeTask({ id: "4", assignedTo: "mum", dueDate: null, status: "done", title: "Old task" }),
      makeTask({ id: "5", assignedTo: null, dueDate: TODAY, title: "Unassigned task" }),
    ];

    const workload = computeMemberWorkload([dad, mum], tasks, TODAY);

    const dadWorkload = workload.find((w) => w.member.id === "dad")!;
    expect(dadWorkload.outstandingCount).toBe(3);
    expect(dadWorkload.overdueCount).toBe(1);
    expect(dadWorkload.sampleTitles).toEqual(["Book dentist", "Renew insurance"]);

    const mumWorkload = workload.find((w) => w.member.id === "mum")!;
    expect(mumWorkload.outstandingCount).toBe(0);
    expect(mumWorkload.overdueCount).toBe(0);
    expect(mumWorkload.sampleTitles).toEqual([]);
  });
});
