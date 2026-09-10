export function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} animate-spin rounded-full border-2 border-current border-t-transparent`}
    />
  );
}
