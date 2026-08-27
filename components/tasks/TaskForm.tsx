"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import type { Task } from "@/lib/tasks/types";

type Member = { id: string; displayName: string };
type Category = { id: string; name: string };

export function TaskForm({
  action,
  members,
  categories,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<{ error?: string }>;
  members: Member[];
  categories: Category[];
  defaultValues?: Task;
  submitLabel: string;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => action(formData),
    undefined,
  );

  function setDueDateOffset(daysFromToday: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    if (dateInputRef.current) dateInputRef.current.value = date.toISOString().slice(0, 10);
  }

  const chipClass =
    "cursor-pointer rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white";

  return (
    <form action={formAction} className="space-y-6">
      {defaultValues && <input type="hidden" name="taskId" value={defaultValues.id} />}

      <Input
        label="What needs doing?"
        name="title"
        defaultValue={defaultValues?.title}
        required
        autoFocus
      />

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Assign to</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map((member) => (
            <label key={member.id} className={chipClass}>
              <input
                type="radio"
                name="assignedTo"
                value={member.id}
                defaultChecked={defaultValues?.assignedTo === member.id}
                className="sr-only"
              />
              {member.displayName}
            </label>
          ))}
          <label className={chipClass}>
            <input
              type="radio"
              name="assignedTo"
              value=""
              defaultChecked={!defaultValues?.assignedTo}
              className="sr-only"
            />
            Anyone
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">
          Due
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setDueDateOffset(0)} className={chipClass}>
            Today
          </button>
          <button type="button" onClick={() => setDueDateOffset(1)} className={chipClass}>
            Tomorrow
          </button>
          <input
            ref={dateInputRef}
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultValues?.dueDate ?? ""}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700"
          />
        </div>
      </div>

      <div>
        <label htmlFor="recurrence" className="block text-sm font-medium text-slate-700">
          Repeat
        </label>
        <select
          id="recurrence"
          name="recurrence"
          defaultValue={defaultValues?.recurrence ?? "never"}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
        >
          <option value="never">Never</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          More options
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={defaultValues?.description ?? ""}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={defaultValues?.categoryId ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      <FormMessage error={state?.error} />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
