import { getCurrentMembership } from "@/lib/families/queries";
import { getFamilyTasks } from "@/lib/tasks/queries";
import { groupForToday } from "@/lib/tasks/grouping";
import { TaskGroups } from "@/components/tasks/TaskGroups";

export default async function TodayPage() {
  const membership = await getCurrentMembership();
  const tasks = membership ? await getFamilyTasks(membership.familyId) : [];
  const todayISO = new Date().toISOString().slice(0, 10);
  const groups = groupForToday(tasks, todayISO);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Today</h1>
      <p className="mt-1 text-sm text-slate-600">{membership?.familyName}</p>
      <div className="mt-4">
        <TaskGroups
          groups={[
            { label: "Overdue", tasks: groups.overdue },
            { label: "Today", tasks: groups.today },
            { label: "Upcoming", tasks: groups.upcoming },
          ]}
          emptyMessage="Nothing due right now. Tap + to add a task."
        />
      </div>
    </div>
  );
}
