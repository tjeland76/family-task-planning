import { notFound } from "next/navigation";
import { getCurrentMembership, getFamilyMembers } from "@/lib/families/queries";
import { getMemberTasks } from "@/lib/tasks/queries";
import { TaskGroups } from "@/components/tasks/TaskGroups";

export default async function FamilyMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) notFound();

  const { memberId } = await params;
  const [members, tasks] = await Promise.all([
    getFamilyMembers(membership.familyId),
    getMemberTasks(membership.familyId, memberId),
  ]);

  const member = members.find((m) => m.id === memberId);
  if (!member) notFound();

  const outstanding = tasks.filter((task) => task.status === "todo");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{member.displayName}</h1>
      <div className="mt-4">
        <TaskGroups
          groups={[{ label: "Outstanding", tasks: outstanding }]}
          emptyMessage="No outstanding tasks."
        />
      </div>
    </div>
  );
}
