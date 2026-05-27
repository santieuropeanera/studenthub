"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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

    setIsSending(true);

    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = (configuredAppUrl ?? "https://studenthub-jade.vercel.app").replace(/\/$/, "");
    const redirectTo = `${appUrl}/auth/set-password`;

    console.log("[Forgot Password] NEXT_PUBLIC_APP_URL:", configuredAppUrl ?? "not configured");
    console.log("[Forgot Password] redirectTo:", redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo
    });

    if (error) {
      console.error("[Forgot Password] Supabase error:", error);
      setMessage(error.message);
      setIsSending(false);
      return;
    }

    setMessage("If this email exists, we've sent password reset instructions.");
    setIsSending(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-era-paper px-4 py-6 sm:py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <img
            className="h-12 w-auto max-w-[132px] shrink-0 object-contain sm:h-14 sm:max-w-[150px]"
            src="/images/Logo%20Web.png"
            alt="European Era logo"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-era-teal sm:text-sm">European Era</p>
            <h1 className="text-xl font-black text-era-navy sm:text-2xl">Reset password</h1>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-era-navy">
            Email
            <input
              className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-era-blue px-4 py-3 font-black text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send reset instructions"}
          </button>
        </form>

        {message ? <p className="mt-4 rounded-md bg-era-paper p-3 text-sm font-semibold text-era-navy">{message}</p> : null}

        <p className="mt-4 text-sm text-slate-600">
          Remember your password?{" "}
          <Link className="font-bold text-era-blue hover:text-era-navy" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
