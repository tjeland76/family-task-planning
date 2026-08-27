"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/families/queries";
import type { Recurrence } from "@/lib/tasks/types";

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

export async function completeTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath("/today");
}

export async function uncompleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").update({ status: "todo", completed_at: null }).eq("id", taskId);

  revalidatePath("/today");
}
