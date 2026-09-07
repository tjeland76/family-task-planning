"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/families/queries";
import { computeNextDueDate } from "@/lib/tasks/recurrence";
import { shouldNotifyAssignment } from "@/lib/notifications/rules";
import { sendPushNotification } from "@/lib/notifications/push";
import type { Recurrence } from "@/lib/tasks/types";

async function notifyAssignment({
  createdBy,
  assignedTo,
  actorDisplayName,
  taskId,
}: {
  createdBy: string;
  assignedTo: string | null;
  actorDisplayName: string;
  taskId: string;
}) {
  if (!shouldNotifyAssignment({ createdBy, assignedTo })) return;

  try {
    await sendPushNotification({
      recipientFamilyMemberId: assignedTo!,
      title: "Family Tasks",
      body: `${actorDisplayName} assigned you a task`,
      url: `/tasks/${taskId}`,
      type: "task_assigned",
    });
  } catch (err) {
    console.error("assignment notification failed", err);
  }
}

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
  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      family_id: membership.familyId,
      created_by: membership.familyMemberId,
      title: fields.title,
      assigned_to: fields.assignedTo,
      due_date: fields.dueDate,
      recurrence: fields.recurrence,
      description: fields.description,
      category_id: fields.categoryId,
    })
    .select("id")
    .single();

  if (error) return { error: "Something went wrong. Please try again." };

  await notifyAssignment({
    createdBy: membership.familyMemberId,
    assignedTo: fields.assignedTo,
    actorDisplayName: membership.displayName,
    taskId: newTask.id,
  });

  redirect("/today");
}

export async function updateTask(formData: FormData): Promise<{ error?: string }> {
  const taskId = String(formData.get("taskId") ?? "");
  const fields = parseTaskFields(formData);
  if (!fields.title) return { error: "Enter what needs doing." };

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Something went wrong. Please try again." };

  const supabase = await createClient();

  const { data: existingTask } = await supabase
    .from("tasks")
    .select("assigned_to")
    .eq("id", taskId)
    .single();

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

  if (fields.assignedTo !== existingTask?.assigned_to) {
    await notifyAssignment({
      createdBy: membership.familyMemberId,
      assignedTo: fields.assignedTo,
      actorDisplayName: membership.displayName,
      taskId,
    });
  }

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

        if (nextOccurrenceId) {
          await notifyAssignment({
            createdBy: membership.familyMemberId,
            assignedTo: task.assigned_to,
            actorDisplayName: membership.displayName,
            taskId: nextOccurrenceId,
          });
        }
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
