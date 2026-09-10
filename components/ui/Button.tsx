import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "@/components/ui/Spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  variant = "primary",
  className,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={clsx(
        "w-full rounded-xl px-4 py-3 text-center text-base font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-slate-900 text-white hover:bg-slate-800",
        variant === "secondary" &&
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner size="sm" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
