import { getCurrentMembership, getFamilyMembers } from "@/lib/families/queries";
import { AddChildForm } from "@/components/families/AddChildForm";
import { ChildMemberRow } from "@/components/families/ChildMemberRow";

export default async function FamilyPage() {
  const membership = await getCurrentMembership();
  const members = membership ? await getFamilyMembers(membership.familyId) : [];

  const parents = members.filter((member) => member.role === "parent");
  const children = members.filter((member) => member.role === "child");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Family</h1>
        <p className="mt-2 text-sm text-slate-600">
          {membership?.familyName} — join code{" "}
          <span className="font-mono font-medium">{membership?.joinCode}</span>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Parents</h2>
        <div className="space-y-2">
          {parents.map((parent) => (
            <div key={parent.id} className="rounded-xl border border-slate-200 p-3 text-slate-900">
              {parent.displayName}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Children</h2>
        <div className="space-y-2">
          {children.length === 0 && (
            <p className="text-sm text-slate-500">No children added yet.</p>
          )}
          {children.map((child) => (
            <ChildMemberRow key={child.id} id={child.id} displayName={child.displayName} />
          ))}
        </div>
        <AddChildForm />
      </section>

      <p className="text-sm text-slate-500">Task workload per member arrives in Phase 4.</p>
    </div>
  );
}
