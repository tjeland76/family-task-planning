import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/tasks/types";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  category_id: string | null;
  due_date: string | null;
  status: "todo" | "done";
  recurrence: Task["recurrence"];
  completed_at: string | null;
  assignee: { display_name: string } | { display_name: string }[] | null;
  category: { name: string } | { name: string }[] | null;
};

function toTask(row: TaskRow): Task {
  const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;
  const category = Array.isArray(row.category) ? row.category[0] : row.category;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    assigneeName: assignee?.display_name ?? null,
    createdBy: row.created_by,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    dueDate: row.due_date,
    status: row.status,
    recurrence: row.recurrence,
    completedAt: row.completed_at,
  };
}

const TASK_SELECT =
  "id, title, description, assigned_to, created_by, category_id, due_date, status, recurrence, completed_at, assignee:family_members!tasks_assigned_to_fkey(display_name), category:categories(name)";

export async function getFamilyTasks(familyId: string): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("family_id", familyId)
    .order("status")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as TaskRow[]).map(toTask);
}

export async function getTask(taskId: string): Promise<Task | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .single();

  if (error || !data) return null;

  return toTask(data as TaskRow);
}

export async function getCategories(
  familyId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("family_id", familyId)
    .order("name");

  if (error || !data) return [];

  return data;
}
