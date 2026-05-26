"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export function DashboardAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
      }
    }

    void checkSession();
  }, [router]);

  return null;
}
