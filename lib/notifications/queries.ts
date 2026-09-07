import "server-only";
import { createClient } from "@/lib/supabase/server";

export type NotificationPreferences = {
  taskAssignedEnabled: boolean;
  dueTodayEnabled: boolean;
};

export async function getNotificationPreferences(
  familyMemberId: string,
): Promise<NotificationPreferences> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notification_preferences")
    .select("task_assigned_enabled, due_today_enabled")
    .eq("family_member_id", familyMemberId)
    .single();

  return {
    taskAssignedEnabled: data?.task_assigned_enabled ?? true,
    dueTodayEnabled: data?.due_today_enabled ?? true,
  };
}

export type PushSubscriptionSummary = {
  id: string;
  userAgent: string | null;
  createdAt: string;
};

export async function getPushSubscriptions(
  familyMemberId: string,
): Promise<PushSubscriptionSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_agent, created_at")
    .eq("family_member_id", familyMemberId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }));
}
