import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      className={clsx(
        "w-full rounded-xl px-4 py-3 text-center text-base font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-slate-900 text-white hover:bg-slate-800",
        variant === "secondary" &&
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        className,
      )}
      {...props}
    />
  );
}
