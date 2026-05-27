"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMessage("Supabase is not configured. Please check the environment variables.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    const normalizedEmail = signInData.user?.email?.trim().toLowerCase() ?? email.trim().toLowerCase();
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("role, email, onboarding_completed")
      .ilike("email", normalizedEmail)
      .limit(1);

    if (profileError) {
      setErrorMessage(profileError.message);
      setIsLoading(false);
      return;
    }

    const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === normalizedEmail);

    if (!profile?.role) {
      setErrorMessage("No role was found for this account. Please contact European Era.");
      setIsLoading(false);
      return;
    }

    if (profile.role === "student") router.push(profile.onboarding_completed ? "/student" : "/student/onboarding");
    else if (profile.role === "teacher") router.push("/teacher");
    else if (profile.role === "admin") router.push("/admin");
    else {
      setErrorMessage(`Unsupported account role: ${profile.role}`);
      setIsLoading(false);
    }
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
            <h1 className="text-xl font-black text-era-navy sm:text-2xl">Sign in</h1>
          </div>
        </div>
        {errorMessage ? (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="grid gap-4">
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
          <label className="grid gap-2 text-sm font-bold text-era-navy">
            Password
            <input
              className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal"
              name="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <div className="-mt-2 text-right">
            <Link className="text-sm font-bold text-era-blue hover:text-era-navy" href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-3 font-black text-white"
            type="submit"
            disabled={isLoading}
          >
            <LockKeyhole className="h-4 w-4" />
            {isLoading ? "Signing in..." : "Sign in with Supabase"}
          </button>
        </form>
      </section>
    </main>
  );
}
