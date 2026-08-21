"use client";

import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" aria-label="Sign out" className="text-xl text-slate-500">
        👤
      </button>
    </form>
  );
}
