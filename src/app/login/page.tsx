import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { AuthForm, Field } from "@/app/auth/AuthForm";

export const metadata = { title: "Log in · Teton Tutors" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <AuthForm action={signIn} submitLabel="Log in">
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </AuthForm>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        New here?{" "}
        <Link href="/signup" className="text-emerald-700 underline dark:text-emerald-400">
          Create an account
        </Link>
      </p>
    </main>
  );
}
