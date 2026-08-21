import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Teton Tutors
        </p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
          SAT, ACT, and AP tutoring that measures what it improves
        </h1>
        <p className="max-w-lg text-zinc-600 dark:text-zinc-400">
          Calibrated practice, adaptive full-length tests, and tutors backed by
          a copilot — with score predictions anchored to official practice
          tests, never guesses.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
