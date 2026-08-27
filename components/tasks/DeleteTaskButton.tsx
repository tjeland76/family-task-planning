"use client";

import { deleteTask } from "@/lib/tasks/actions";

export function DeleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  return (
    <form
      action={deleteTask}
      onSubmit={(event) => {
        if (!confirm(`Delete "${title}"?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <button type="submit" className="text-sm font-medium text-red-600 underline">
        Delete task
      </button>
    </form>
  );
}
