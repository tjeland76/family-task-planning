import "server-only";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

let vapidConfigured = false;

// Deferred until first actual send, not run at module load -- otherwise
// merely *importing* this file (e.g. transitively, from a test that never
// calls sendPushNotification) crashes in any environment without VAPID env
// vars configured.
function ensureVapidConfigured() {
  if (vapidConfigured) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidConfigured = true;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type NotificationType = "task_assigned" | "due_today";

type SendPushArgs = {
  recipientFamilyMemberId: string;
  title: string;
  body: string;
  url: string;
  type: NotificationType;
};

/**
 * Sends a push notification to every device registered for
 * `recipientFamilyMemberId`, respecting their preferences. Never throws --
 * every failure mode (disabled preference, no subscriptions, an individual
 * send failing) is handled internally, since notification delivery must
 * never block the task operation that triggered it.
 */
export async function sendPushNotification({
  recipientFamilyMemberId,
  title,
  body,
  url,
  type,
}: SendPushArgs): Promise<void> {
  ensureVapidConfigured();

  const supabase = getServiceClient();

  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("task_assigned_enabled, due_today_enabled")
    .eq("family_member_id", recipientFamilyMemberId)
    .single();

  const enabled =
    type === "task_assigned"
      ? (preferences?.task_assigned_enabled ?? true)
      : (preferences?.due_today_enabled ?? true);

  if (!enabled) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("family_member_id", recipientFamilyMemberId);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url, type });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        );

        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", subscription.id);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        } else {
          console.error("push send failed", err);
        }
      }
    }),
  );
}
