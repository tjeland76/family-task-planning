import type { FamilyMember } from "@/lib/families/queries";
import type { Task } from "@/lib/tasks/types";

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sortByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"));
}

export type TodayGroups = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
};

/**
 * Overdue / Today / Upcoming (~7 days) — whole-family, outstanding tasks
 * only. Tasks with no due date, or due further out than `upcomingDays`,
 * don't appear on Today at all (spec section 8).
 */
export function groupForToday(tasks: Task[], todayISO: string, upcomingDays = 7): TodayGroups {
  const outstanding = tasks.filter((task) => task.status === "todo" && task.dueDate);
  const upcomingCutoff = addDays(todayISO, upcomingDays);

  return {
    overdue: sortByDueDate(outstanding.filter((task) => task.dueDate! < todayISO)),
    today: sortByDueDate(outstanding.filter((task) => task.dueDate === todayISO)),
    upcoming: sortByDueDate(
      outstanding.filter((task) => task.dueDate! > todayISO && task.dueDate! <= upcomingCutoff),
    ),
  };
}

export type MyTasksGroups = {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
  later: Task[];
  noDueDate: Task[];
};

/**
 * Overdue / Today / This week / Later / No due date — a single member's
 * full outstanding backlog (spec section 9), unlike Today which only shows
 * the near-term slice.
 */
export function groupForMyTasks(tasks: Task[], todayISO: string, weekDays = 7): MyTasksGroups {
  const outstanding = tasks.filter((task) => task.status === "todo");
  const weekCutoff = addDays(todayISO, weekDays);

  return {
    overdue: sortByDueDate(outstanding.filter((task) => task.dueDate && task.dueDate < todayISO)),
    today: sortByDueDate(outstanding.filter((task) => task.dueDate === todayISO)),
    thisWeek: sortByDueDate(
      outstanding.filter((task) => task.dueDate && task.dueDate > todayISO && task.dueDate <= weekCutoff),
    ),
    later: sortByDueDate(outstanding.filter((task) => task.dueDate && task.dueDate > weekCutoff)),
    noDueDate: outstanding.filter((task) => !task.dueDate),
  };
}

export type MemberWorkload = {
  member: FamilyMember;
  outstandingCount: number;
  overdueCount: number;
  sampleTitles: string[];
};

/**
 * Per-member outstanding count, overdue count, and a couple of sample
 * titles for the Family workload overview (spec section 12).
 */
export function computeMemberWorkload(
  members: FamilyMember[],
  tasks: Task[],
  todayISO: string,
  sampleSize = 2,
): MemberWorkload[] {
  return members.map((member) => {
    const memberTasks = sortByDueDate(
      tasks.filter((task) => task.status === "todo" && task.assignedTo === member.id),
    );

    return {
      member,
      outstandingCount: memberTasks.length,
      overdueCount: memberTasks.filter((task) => task.dueDate && task.dueDate < todayISO).length,
      sampleTitles: memberTasks.slice(0, sampleSize).map((task) => task.title),
    };
  });
}
