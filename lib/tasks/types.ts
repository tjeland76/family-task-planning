import type { Recurrence } from "@/lib/tasks/recurrence";

export type { Recurrence };
export type TaskStatus = "todo" | "done";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  createdBy: string;
  categoryId: string | null;
  categoryName: string | null;
  dueDate: string | null;
  status: TaskStatus;
  recurrence: Recurrence;
  completedAt: string | null;
};
