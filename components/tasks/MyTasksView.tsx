"use client";

import { useState } from "react";
import clsx from "clsx";
import { TaskGroups } from "@/components/tasks/TaskGroups";
import { CompletedTaskList } from "@/components/tasks/CompletedTaskList";
import { groupForMyTasks } from "@/lib/tasks/grouping";
import type { Task } from "@/lib/tasks/types";

export function MyTasksView({
  todoTasks,
  doneTasks,
  todayISO,
}: {
  todoTasks: Task[];
  doneTasks: Task[];
  todayISO: string;
}) {
  const [tab, setTab] = useState<"todo" | "completed">("todo");
  const groups = groupForMyTasks(todoTasks, todayISO);

  const tabClass = (active: boolean) =>
    clsx(
      "flex-1 rounded-full px-4 py-2 text-sm font-medium",
      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600",
    );

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" className={tabClass(tab === "todo")} onClick={() => setTab("todo")}>
          To Do
        </button>
        <button
          type="button"
          className={tabClass(tab === "completed")}
          onClick={() => setTab("completed")}
        >
          Completed
        </button>
      </div>

      <div className="mt-4">
        {tab === "todo" ? (
          <TaskGroups
            groups={[
              { label: "Overdue", tasks: groups.overdue },
              { label: "Today", tasks: groups.today },
              { label: "This week", tasks: groups.thisWeek },
              { label: "Later", tasks: groups.later },
              { label: "No due date", tasks: groups.noDueDate },
            ]}
            emptyMessage="No outstanding tasks. Tap + to add one."
          />
        ) : (
          <CompletedTaskList tasks={doneTasks} />
        )}
      </div>
    </div>
  );
}
