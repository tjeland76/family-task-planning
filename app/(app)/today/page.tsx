import { getCurrentMembership } from "@/lib/families/queries";

export default async function TodayPage() {
  const membership = await getCurrentMembership();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Today</h1>
      <p className="mt-2 text-sm text-slate-600">
        {membership?.familyName} — task lists arrive in Phase 3/4.
      </p>
    </div>
  );
}
