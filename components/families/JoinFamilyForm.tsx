"use client";

import { useActionState } from "react";
import { joinFamily } from "@/lib/families/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export function JoinFamilyForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => joinFamily(formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Join code"
        name="joinCode"
        placeholder="e.g. ELAND2"
        autoCapitalize="characters"
        required
      />
      <FormMessage error={state?.error} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Joining…" : "Join family"}
      </Button>
    </form>
  );
}
