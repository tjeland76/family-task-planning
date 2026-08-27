import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentMembership, getFamilyMembers } from "@/lib/families/queries";
import { getCategories, getTask } from "@/lib/tasks/queries";
import { updateTask } from "@/lib/tasks/actions";
import { TaskForm } from "@/components/tasks/TaskForm";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const { id } = await params;
  const [task, members, categories] = await Promise.all([
    getTask(id),
    getFamilyMembers(membership.familyId),
    getCategories(membership.familyId),
  ]);

  if (!task) notFound();

  const parents = members.filter((member) => member.role === "parent");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/today" aria-label="Close" className="text-2xl text-slate-500">
          ✕
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Edit Task</h1>
        <span className="w-6" aria-hidden="true" />
      </div>
      <TaskForm
        action={updateTask}
        members={parents}
        categories={categories}
        defaultValues={task}
        submitLabel="Save"
      />
      <div className="mt-6 text-center">
        <DeleteTaskButton taskId={task.id} title={task.title} />
      </div>
    </main>
  );
}
