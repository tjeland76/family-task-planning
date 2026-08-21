"use client";

import { useActionState } from "react";
import { createFamily } from "@/lib/families/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => createFamily(formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Family name"
        name="familyName"
        placeholder="e.g. Eland Family"
        required
      />
      <FormMessage error={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create family"}
      </Button>
    </form>
  );
}
