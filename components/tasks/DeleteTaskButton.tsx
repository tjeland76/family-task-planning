"use client";

import { useTransition } from "react";
import { deleteTask } from "@/lib/tasks/actions";
import { Button } from "@/components/ui/Button";

export function DeleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  const [isDeleting, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!confirm(`Delete "${title}"?`)) return;

        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          await deleteTask(formData);
        });
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <Button
        type="submit"
        variant="secondary"
        loading={isDeleting}
        loadingText="Deleting…"
        className="text-red-600"
      >
        Delete task
      </Button>
    </form>
  );
}
