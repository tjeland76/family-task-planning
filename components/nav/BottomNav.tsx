"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const DESTINATIONS = [
  { href: "/today", label: "Today" },
  { href: "/my-tasks", label: "My Tasks" },
  { href: "/family", label: "Family" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {DESTINATIONS.map((destination) => {
          const active = pathname.startsWith(destination.href);
          return (
            <Link
              key={destination.href}
              href={destination.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex-1 rounded-lg px-2 py-2 text-center text-sm font-medium",
                active ? "text-slate-900" : "text-slate-400",
              )}
            >
              {destination.label}
            </Link>
          );
        })}
        <Link
          href="/add-task"
          aria-label="Add task"
          className="absolute -top-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-2xl leading-none text-white shadow-lg"
        >
          +
        </Link>
      </div>
    </nav>
  );
}
