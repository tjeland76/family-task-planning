"use client";

import { useActionState, useState } from "react";
import { renameFamilyMember, removeFamilyMember } from "@/lib/families/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export function ChildMemberRow({ id, displayName }: { id: string; displayName: string }) {
  const [editing, setEditing] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await renameFamilyMember(formData);
      if (!result.error) setEditing(false);
      return result;
    },
    undefined,
  );

  if (editing) {
    return (
      <form action={formAction} className="space-y-2 rounded-xl border border-slate-200 p-3">
        <input type="hidden" name="memberId" value={id} />
        <Input label="Name" name="displayName" defaultValue={displayName} required />
        <FormMessage error={state?.error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
      <span className="text-slate-900">{displayName}</span>
      <div className="flex gap-3 text-sm">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-medium text-slate-600 underline"
        >
          Edit
        </button>
        <form
          action={removeFamilyMember}
          onSubmit={(event) => {
            if (!confirm(`Remove ${displayName} from the family?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="memberId" value={id} />
          <button type="submit" className="font-medium text-red-600 underline">
            Remove
          </button>
        </form>
      </div>
    </div>
  );
}
