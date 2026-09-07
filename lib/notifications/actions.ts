"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/families/queries";

type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(
  subscription: PushSubscriptionInput,
  userAgent: string | null,
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Something went wrong. Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      family_member_id: membership.familyMemberId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/settings");
  return {};
}

export async function unsubscribeFromPush(subscriptionId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("id", subscriptionId);

  revalidatePath("/settings");
}

export async function updateNotificationPreference(
  key: "taskAssignedEnabled" | "dueTodayEnabled",
  enabled: boolean,
): Promise<void> {
  const membership = await getCurrentMembership();
  if (!membership) return;

  const column = key === "taskAssignedEnabled" ? "task_assigned_enabled" : "due_today_enabled";

  const supabase = await createClient();
  await supabase
    .from("notification_preferences")
    .update({ [column]: enabled })
    .eq("family_member_id", membership.familyMemberId);

  revalidatePath("/settings");
}
