export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;

  return (
    <p
      role="status"
      className={error ? "text-sm text-red-600" : "text-sm text-slate-600"}
    >
      {error ?? message}
    </p>
  );
}
