/**
 * Whether creating/reassigning a task to `assignedTo` should notify that
 * person, per spec: don't notify on self-assignment or when unassigned.
 */
export function shouldNotifyAssignment({
  createdBy,
  assignedTo,
}: {
  createdBy: string;
  assignedTo: string | null;
}): boolean {
  return assignedTo !== null && assignedTo !== createdBy;
}

export type DueTodayTask = {
  title: string;
  assignedTo: string | null;
  status: "todo" | "done";
  dueDate: string | null;
};

export type DueTodaySummary = {
  familyMemberId: string;
  taskCount: number;
  firstTaskTitle: string;
};

/**
 * Groups outstanding, due-today, assigned tasks by assignee into one
 * summary each -- re-applies every filter itself (not just the DB query's
 * WHERE clause) so this stays testable and authoritative on its own.
 */
export function buildDueTodaySummaries(tasks: DueTodayTask[], todayISO: string): DueTodaySummary[] {
  const outstanding = tasks.filter(
    (task) => task.status === "todo" && task.dueDate === todayISO && task.assignedTo !== null,
  );

  const byMember = new Map<string, DueTodayTask[]>();
  for (const task of outstanding) {
    const list = byMember.get(task.assignedTo!) ?? [];
    list.push(task);
    byMember.set(task.assignedTo!, list);
  }

  return [...byMember.entries()].map(([familyMemberId, memberTasks]) => ({
    familyMemberId,
    taskCount: memberTasks.length,
    firstTaskTitle: memberTasks[0].title,
  }));
}

export function formatDueTodayMessage(summary: DueTodaySummary): { title: string; body: string } {
  if (summary.taskCount === 1) {
    return { title: "Family Tasks", body: `1 task due today\n${summary.firstTaskTitle}` };
  }

  return {
    title: "Family Tasks",
    body: `${summary.taskCount} tasks due today\nTap to view your tasks`,
  };
}
