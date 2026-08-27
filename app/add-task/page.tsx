import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentMembership, getFamilyMembers } from "@/lib/families/queries";
import { getCategories } from "@/lib/tasks/queries";
import { createTask } from "@/lib/tasks/actions";
import { TaskForm } from "@/components/tasks/TaskForm";

export default async function AddTaskPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const [members, categories] = await Promise.all([
    getFamilyMembers(membership.familyId),
    getCategories(membership.familyId),
  ]);
  const parents = members.filter((member) => member.role === "parent");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/today" aria-label="Close" className="text-2xl text-slate-500">
          ✕
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Add Task</h1>
        <span className="w-6" aria-hidden="true" />
      </div>
      <TaskForm action={createTask} members={parents} categories={categories} submitLabel="Add Task" />
    </main>
  );
}
