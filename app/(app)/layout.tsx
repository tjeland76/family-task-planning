import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/families/queries";
import { BottomNav } from "@/components/nav/BottomNav";
import { SignOutButton } from "@/components/nav/SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  return (
    <div className="min-h-dvh pb-24">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-lg font-semibold text-slate-900">Family Tasks</span>
        <SignOutButton />
      </header>
      <div className="mx-auto max-w-md px-4 py-4">{children}</div>
      <BottomNav />
    </div>
  );
}
