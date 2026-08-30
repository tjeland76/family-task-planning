"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/families/queries";
import { computeNextDueDate } from "@/lib/tasks/recurrence";
import type { Recurrence } from "@/lib/tasks/types";

function revalidateTaskViews() {
  revalidatePath("/today");
  revalidatePath("/my-tasks");
  revalidatePath("/family");
}

function parseTaskFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const assignedToRaw = String(formData.get("assignedTo") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const recurrence = String(formData.get("recurrence") ?? "never") as Recurrence;
  const description = String(formData.get("description") ?? "").trim();
  const categoryIdRaw = String(formData.get("categoryId") ?? "");

  return {
    title,
    assignedTo: assignedToRaw || null,
    dueDate: dueDateRaw || null,
    recurrence,
    description: description || null,
    categoryId: categoryIdRaw || null,
  };
}

export async function createTask(formData: FormData): Promise<{ error?: string }> {
  const fields = parseTaskFields(formData);
  if (!fields.title) return { error: "Enter what needs doing." };

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Something went wrong. Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    family_id: membership.familyId,
    created_by: membership.familyMemberId,
    title: fields.title,
    assigned_to: fields.assignedTo,
    due_date: fields.dueDate,
    recurrence: fields.recurrence,
    description: fields.description,
    category_id: fields.categoryId,
  });

  if (error) return { error: "Something went wrong. Please try again." };

  redirect("/today");
}

export async function updateTask(formData: FormData): Promise<{ error?: string }> {
  const taskId = String(formData.get("taskId") ?? "");
  const fields = parseTaskFields(formData);
  if (!fields.title) return { error: "Enter what needs doing." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: fields.title,
      assigned_to: fields.assignedTo,
      due_date: fields.dueDate,
      recurrence: fields.recurrence,
      description: fields.description,
      category_id: fields.categoryId,
    })
    .eq("id", taskId);

  if (error) return { error: "Something went wrong. Please try again." };

  redirect("/today");
}

export async function deleteTask(formData: FormData): Promise<void> {
  const taskId = String(formData.get("taskId") ?? "");

  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);

  redirect("/today");
}

export async function completeTask(taskId: string): Promise<{ nextOccurrenceId: string | null }> {
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("family_id, title, description, assigned_to, category_id, due_date, recurrence")
    .eq("id", taskId)
    .single();

  await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  let nextOccurrenceId: string | null = null;

  if (task?.due_date) {
    const nextDueDate = computeNextDueDate(task.due_date, task.recurrence);

    if (nextDueDate) {
      const membership = await getCurrentMembership();

      if (membership) {
        const { data: nextTask } = await supabase
          .from("tasks")
          .insert({
            family_id: task.family_id,
            title: task.title,
            description: task.description,
            assigned_to: task.assigned_to,
            created_by: membership.familyMemberId,
            category_id: task.category_id,
            due_date: nextDueDate,
            recurrence: task.recurrence,
            parent_task_id: taskId,
          })
          .select("id")
          .single();

        nextOccurrenceId = nextTask?.id ?? null;
      }
    }
  }

  revalidateTaskViews();
  return { nextOccurrenceId };
}

export async function uncompleteTask(
  taskId: string,
  nextOccurrenceId?: string | null,
): Promise<void> {
  const supabase = await createClient();

  if (nextOccurrenceId) {
    await supabase.from("tasks").delete().eq("id", nextOccurrenceId);
  }

  await supabase.from("tasks").update({ status: "todo", completed_at: null }).eq("id", taskId);

  revalidateTaskViews();
}
