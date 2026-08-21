"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; message?: string } | undefined,
      formData: FormData,
    ) => signUp(formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Your name" name="displayName" autoComplete="name" required />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage error={state?.error} message={state?.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
