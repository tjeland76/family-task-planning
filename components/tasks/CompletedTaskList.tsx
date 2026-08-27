import Link from "next/link";
import type { Task } from "@/lib/tasks/types";

function formatCompletedDate(completedAt: string | null): string {
  if (!completedAt) return "";
  return new Date(completedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function CompletedTaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No completed tasks yet.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/tasks/${task.id}`}
          className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
        >
          <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-900 bg-slate-900" />
          <span className="min-w-0 flex-1">
            <p className="truncate text-slate-400 line-through">{task.title}</p>
            <p className="truncate text-sm text-slate-500">
              Completed {formatCompletedDate(task.completedAt)}
            </p>
          </span>
        </Link>
      ))}
    </div>
  );
}
