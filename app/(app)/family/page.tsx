import { getCurrentMembership } from "@/lib/families/queries";

export default async function FamilyPage() {
  const membership = await getCurrentMembership();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Family</h1>
      <p className="mt-2 text-sm text-slate-600">
        {membership?.familyName} — join code{" "}
        <span className="font-mono font-medium">{membership?.joinCode}</span>
      </p>
      <p className="mt-4 text-sm text-slate-600">Member workload arrives in Phase 4.</p>
    </div>
  );
}
