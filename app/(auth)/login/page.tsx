import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Family Tasks</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to your family.</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="font-medium text-slate-900 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
