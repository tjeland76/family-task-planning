import { Spinner } from "@/components/ui/Spinner";

export default function TodayLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <Spinner size="md" />
      <p className="text-sm">Loading tasks…</p>
    </div>
  );
}
