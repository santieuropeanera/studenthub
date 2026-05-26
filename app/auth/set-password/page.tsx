"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("StudentHub is not connected to Supabase yet.");
      return;
    }

    if (password.length < 6) {
      setMessage("Please choose a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-era-paper px-4 py-8 text-era-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm font-bold uppercase text-era-blue">European Era StudentHub</p>
          <h1 className="mt-2 text-2xl font-black text-era-navy">Create your password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use the secure invitation link from your email to set your StudentHub password.
          </p>

          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-bold text-era-navy">
              New password
              <input
                className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-era-navy">
              Confirm password
              <input
                className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <button
              className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save password"}
            </button>
          </form>

          {message ? <p className="mt-4 rounded-md bg-era-paper p-3 text-sm font-semibold text-era-navy">{message}</p> : null}

          <p className="mt-4 text-sm text-slate-600">
            Already created your password?{" "}
            <Link className="font-bold text-era-blue hover:text-era-navy" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
