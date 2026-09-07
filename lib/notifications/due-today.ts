import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/notifications/push";
import { buildDueTodaySummaries, formatDueTodayMessage } from "@/lib/notifications/rules";

const FAMILY_TIMEZONE = "Europe/London";

export function getTodayInFamilyTimezone(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FAMILY_TIMEZONE }).format(date);
}

/**
 * Whether it's currently 8am in the family's timezone. Vercel Cron only
 * runs in UTC and can't shift itself for BST, so the cron fires hourly and
 * this decides whether to actually do anything -- correct across the DST
 * boundary without a timezone library.
 */
export function isReminderHour(date: Date = new Date()): boolean {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: FAMILY_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(date);

  return Number(hour) === 8;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function runDueTodayJob(): Promise<{ notified: number; skipped: number }> {
  const supabase = getServiceClient();
  const todayISO = getTodayInFamilyTimezone();

  const { data: rows } = await supabase
    .from("tasks")
    .select("title, assigned_to, status, due_date")
    .eq("status", "todo")
    .eq("due_date", todayISO)
    .not("assigned_to", "is", null);

  const tasks = (rows ?? []).map((row) => ({
    title: row.title,
    assignedTo: row.assigned_to,
    status: row.status,
    dueDate: row.due_date,
  }));

  const summaries = buildDueTodaySummaries(tasks, todayISO);

  let notified = 0;
  let skipped = 0;

  for (const summary of summaries) {
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("due_today_enabled")
      .eq("family_member_id", summary.familyMemberId)
      .single();

    if (preferences?.due_today_enabled === false) {
      skipped++;
      continue;
    }

    // Insert-first idempotency: the partial unique index on
    // (family_member_id, reference_date) where notification_type =
    // 'due_today' makes a same-day duplicate insert fail -- that failure
    // *is* the "already sent today" signal, closing the race window a
    // check-then-send approach would leave open if the hourly cron ever
    // overlapped itself.
    const { error: logError } = await supabase.from("notification_delivery_log").insert({
      family_member_id: summary.familyMemberId,
      notification_type: "due_today",
      reference_date: todayISO,
    });

    if (logError) {
      skipped++;
      continue;
    }

    const { title, body } = formatDueTodayMessage(summary);

    try {
      await sendPushNotification({
        recipientFamilyMemberId: summary.familyMemberId,
        title,
        body,
        url: "/my-tasks",
        type: "due_today",
      });
    } catch (err) {
      console.error("due-today notification failed", err);
    }

    notified++;
  }

  return { notified, skipped };
}
