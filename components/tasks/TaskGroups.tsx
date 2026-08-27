"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { completeTask, uncompleteTask } from "@/lib/tasks/actions";
import type { Task } from "@/lib/tasks/types";

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date";

  const today = new Date().toISOString().slice(0, 10);
  if (dueDate === today) return "Today";

  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

type Group = { label: string; tasks: Task[] };

export function TaskGroups({ groups, emptyMessage }: { groups: Group[]; emptyMessage: string }) {
  const [state, setState] = useState(() => groups.map((group) => ({ ...group, tasks: [...group.tasks] })));
  const [undo, setUndo] = useState<{ groupIndex: number; index: number; task: Task } | null>(null);
  const [, startTransition] = useTransition();

  const hasAnyTasks = state.some((group) => group.tasks.length > 0);

  function handleComplete(groupIndex: number, task: Task) {
    setState((current) => {
      const next = current.map((group) => ({ ...group, tasks: [...group.tasks] }));
      const index = next[groupIndex].tasks.findIndex((t) => t.id === task.id);
      if (index === -1) return current;

      next[groupIndex].tasks.splice(index, 1);
      setUndo({ groupIndex, index, task });
      return next;
    });

    startTransition(async () => {
      await completeTask(task.id);
    });

    setTimeout(() => {
      setUndo((current) => (current?.task.id === task.id ? null : current));
    }, 5000);
  }

  function handleUndo() {
    if (!undo) return;
    const { groupIndex, index, task } = undo;

    setState((current) => {
      const next = current.map((group) => ({ ...group, tasks: [...group.tasks] }));
      next[groupIndex].tasks.splice(index, 0, task);
      return next;
    });

    startTransition(async () => {
      await uncompleteTask(task.id);
    });

    setUndo(null);
  }

  if (!hasAnyTasks) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-6">
      {state.map(
        (group, groupIndex) =>
          group.tasks.length > 0 && (
            <section key={group.label} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <button
                      type="button"
                      aria-label="Mark as done"
                      onClick={() => handleComplete(groupIndex, task)}
                      className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300"
                    />
                    <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-slate-900">{task.title}</p>
                      <p className="truncate text-sm text-slate-500">
                        {task.assigneeName ?? "Anyone"} · {formatDueDate(task.dueDate)}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ),
      )}

      {undo && (
        <div className="fixed inset-x-4 bottom-24 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
          <span className="text-sm">Task completed</span>
          <button type="button" className="text-sm font-semibold underline" onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
