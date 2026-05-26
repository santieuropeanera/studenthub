"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export function LogoutTestButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.signOut();
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="block min-h-12 w-full rounded-md bg-era-blue px-5 py-3 text-center text-base font-black text-white shadow-sm hover:bg-era-navy disabled:opacity-70 sm:ml-auto sm:mr-4 sm:mt-4 sm:w-fit"
      type="button"
      disabled={isSigningOut}
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}
