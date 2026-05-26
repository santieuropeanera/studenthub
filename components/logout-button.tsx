"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type LogoutButtonProps = {
  variant?: "desktop" | "mobile";
};

export function LogoutButton({ variant = "desktop" }: LogoutButtonProps) {
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

  const label = isSigningOut ? "Logging out..." : "Log out";

  if (variant === "mobile") {
    return (
      <button
        className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-era-navy hover:bg-era-sky disabled:opacity-70"
        type="button"
        disabled={isSigningOut}
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 shrink-0 text-era-blue" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-era-navy disabled:opacity-70"
      type="button"
      disabled={isSigningOut}
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
