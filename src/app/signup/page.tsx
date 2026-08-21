import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { AuthForm, Field } from "@/app/auth/AuthForm";
import { SELF_SIGNUP_ROLES } from "@/lib/roles";

export const metadata = { title: "Sign up · Teton Tutors" };

const ROLE_LABELS: Record<(typeof SELF_SIGNUP_ROLES)[number], string> = {
  parent: "Parent",
  student: "Student",
  tutor: "Tutor",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <AuthForm action={signUp} submitLabel="Sign up">
        <Field label="Name" name="displayName" autoComplete="name" />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <label className="flex flex-col gap-1 text-sm font-medium">
          I am a
          <select
            name="role"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
          >
            {SELF_SIGNUP_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
      </AuthForm>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-700 underline dark:text-emerald-400">
          Log in
        </Link>
      </p>
    </main>
  );
}
