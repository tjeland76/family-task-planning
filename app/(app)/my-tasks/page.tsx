import { getCurrentMembership } from "@/lib/families/queries";
import { getMemberTasks } from "@/lib/tasks/queries";
import { MyTasksView } from "@/components/tasks/MyTasksView";

export default async function MyTasksPage() {
  const membership = await getCurrentMembership();
  const tasks = membership
    ? await getMemberTasks(membership.familyId, membership.familyMemberId)
    : [];

  const todoTasks = tasks.filter((task) => task.status === "todo");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>
      <p className="mt-1 text-sm text-slate-600">{membership?.displayName}</p>
      <div className="mt-4">
        <MyTasksView todoTasks={todoTasks} doneTasks={doneTasks} todayISO={todayISO} />
      </div>
    </div>
  );
}
