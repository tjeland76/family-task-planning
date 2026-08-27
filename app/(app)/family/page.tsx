import Link from "next/link";
import { getCurrentMembership, getFamilyMembers } from "@/lib/families/queries";
import { getFamilyTasks } from "@/lib/tasks/queries";
import { computeMemberWorkload, type MemberWorkload } from "@/lib/tasks/grouping";
import { AddChildForm } from "@/components/families/AddChildForm";
import { ChildMemberRow } from "@/components/families/ChildMemberRow";

function MemberWorkloadCard({ workload }: { workload: MemberWorkload }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-900">{workload.member.displayName}</span>
        <span className="text-slate-500">{workload.outstandingCount}</span>
      </div>
      {workload.overdueCount > 0 && (
        <p className="mt-1 text-sm text-amber-600">⚠ {workload.overdueCount} overdue</p>
      )}
      {workload.sampleTitles.map((title) => (
        <p key={title} className="mt-1 truncate text-sm text-slate-600">
          {title}
        </p>
      ))}
      {workload.outstandingCount > 0 && (
        <Link
          href={`/family/${workload.member.id}`}
          className="mt-2 inline-block text-sm font-medium text-slate-600 underline"
        >
          View all ›
        </Link>
      )}
    </div>
  );
}

export default async function FamilyPage() {
  const membership = await getCurrentMembership();
  const members = membership ? await getFamilyMembers(membership.familyId) : [];
  const tasks = membership ? await getFamilyTasks(membership.familyId) : [];
  const todayISO = new Date().toISOString().slice(0, 10);
  const workloads = computeMemberWorkload(members, tasks, todayISO);

  const parents = members.filter((member) => member.role === "parent");
  const children = members.filter((member) => member.role === "child");
  const totalOutstanding = workloads.reduce((sum, w) => sum + w.outstandingCount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Family</h1>
        <p className="mt-1 text-sm text-slate-600">{totalOutstanding} tasks outstanding</p>
        <p className="mt-2 text-sm text-slate-600">
          {membership?.familyName} — join code{" "}
          <span className="font-mono font-medium">{membership?.joinCode}</span>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Parents</h2>
        <div className="space-y-2">
          {parents.map((parent) => (
            <MemberWorkloadCard
              key={parent.id}
              workload={workloads.find((w) => w.member.id === parent.id)!}
            />
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
    </div>
  );
}
