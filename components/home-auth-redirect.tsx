"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectSignedInUser() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const email = user?.email?.trim().toLowerCase();

      if (!email) return;

      const { data: profileRows, error } = await supabase
        .from("profiles")
        .select("role, email, onboarding_completed, teacher_onboarding_completed")
        .ilike("email", email)
        .limit(1);

      if (error) {
        console.error("[Home] Could not load signed-in profile role", error);
        return;
      }

      const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === email);

      if (profile?.role === "student") router.replace(profile.onboarding_completed ? "/student" : "/student/onboarding");
      else if (profile?.role === "teacher") router.replace(profile.teacher_onboarding_completed ? "/teacher" : "/teacher/onboarding");
      else if (profile?.role === "admin") router.replace("/admin");
    }

    void redirectSignedInUser();
  }, [router]);

  return null;
}
