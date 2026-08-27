"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
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

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition();
  const [undo, setUndo] = useState<{ id: string; title: string } | null>(null);

  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No tasks yet. Tap + to add one.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <button
            type="button"
            aria-label={task.status === "done" ? "Mark as not done" : "Mark as done"}
            onClick={() => {
              startTransition(async () => {
                if (task.status === "done") {
                  await uncompleteTask(task.id);
                  setUndo((current) => (current?.id === task.id ? null : current));
                } else {
                  await completeTask(task.id);
                  setUndo({ id: task.id, title: task.title });
                  setTimeout(() => {
                    setUndo((current) => (current?.id === task.id ? null : current));
                  }, 5000);
                }
              });
            }}
            className={clsx(
              "h-6 w-6 shrink-0 rounded-full border-2",
              task.status === "done" ? "border-slate-900 bg-slate-900" : "border-slate-300",
            )}
          />
          <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
            <p
              className={clsx(
                "truncate text-slate-900",
                task.status === "done" && "text-slate-400 line-through",
              )}
            >
              {task.title}
            </p>
            <p className="truncate text-sm text-slate-500">
              {task.assigneeName ?? "Anyone"} · {formatDueDate(task.dueDate)}
            </p>
          </Link>
        </div>
      ))}

      {undo && (
        <div className="fixed inset-x-4 bottom-24 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
          <span className="text-sm">Task completed</span>
          <button
            type="button"
            className="text-sm font-semibold underline"
            onClick={() => {
              const taskId = undo.id;
              startTransition(async () => {
                await uncompleteTask(taskId);
              });
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
