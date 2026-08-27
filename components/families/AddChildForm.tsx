"use client";

import { useActionState, useRef } from "react";
import { addFamilyMember } from "@/lib/families/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export function AddChildForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await addFamilyMember(formData);
      if (!result.error) formRef.current?.reset();
      return result;
    },
    undefined,
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <Input label="Child's name" name="displayName" placeholder="e.g. Child 1" required />
      <FormMessage error={state?.error} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add child"}
      </Button>
    </form>
  );
}
