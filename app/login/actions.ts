"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login?error=supabase-not-configured");
  }

  const supabase = createSupabaseServerClient();
  let loginError = false;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    loginError = Boolean(error);
  } catch {
    loginError = true;
  }

  if (loginError) {
    redirect("/login?error=invalid-login");
  }

  redirect("/student");
}
