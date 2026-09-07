import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentMembership } from "@/lib/families/queries";
import { getNotificationPreferences, getPushSubscriptions } from "@/lib/notifications/queries";
import { signOut } from "@/lib/auth/actions";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export default async function SettingsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const [preferences, subscriptions] = await Promise.all([
    getNotificationPreferences(membership.familyMemberId),
    getPushSubscriptions(membership.familyMemberId),
  ]);

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/today" aria-label="Close" className="text-2xl text-slate-500">
          ✕
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        <span className="w-6" aria-hidden="true" />
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Notifications
        </h2>
        <NotificationSettings preferences={preferences} subscriptions={subscriptions} />
      </section>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <form action={signOut}>
          <button type="submit" className="text-sm font-medium text-slate-500 underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
