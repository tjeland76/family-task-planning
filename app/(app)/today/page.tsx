import { getCurrentMembership } from "@/lib/families/queries";
import { getFamilyTasks } from "@/lib/tasks/queries";
import { TaskList } from "@/components/tasks/TaskList";

export default async function TodayPage() {
  const membership = await getCurrentMembership();
  const tasks = membership ? await getFamilyTasks(membership.familyId) : [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Today</h1>
      <p className="mt-1 text-sm text-slate-600">{membership?.familyName}</p>
      <div className="mt-4">
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}
