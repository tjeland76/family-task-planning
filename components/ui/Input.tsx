import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
      {label}
      <input
        id={inputId}
        className={clsx(
          "mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900",
          className,
        )}
        {...props}
      />
    </label>
  );
}
