import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/families/queries";
import { signOut } from "@/lib/auth/actions";
import { CreateFamilyForm } from "@/components/families/CreateFamilyForm";
import { JoinFamilyForm } from "@/components/families/JoinFamilyForm";

export default async function OnboardingPage() {
  const membership = await getCurrentMembership();
  if (membership) redirect("/today");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Set up your family</h1>
          <form action={signOut}>
            <button type="submit" className="text-sm font-medium text-slate-500 underline">
              Sign out
            </button>
          </form>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Start a new family, or join one your partner already created.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Start a new family
        </h2>
        <CreateFamilyForm />
      </section>

      <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Join your partner&apos;s family
        </h2>
        <JoinFamilyForm />
      </section>
    </main>
  );
}
