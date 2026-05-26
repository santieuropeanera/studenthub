"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type ProfileRow = {
  group_name: string | null;
};

type GroupRow = {
  name: string | null;
};

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function AdminSummaryStats() {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [groupsCount, setGroupsCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [{ count, error: countError }, { data: profiles, error: profilesError }, { data: groups, error: groupsError }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("group_name"),
          supabase.from("groups").select("name")
        ]);

        if (countError) throw countError;
        if (profilesError) throw profilesError;
        if (groupsError) throw groupsError;

        const groupNames = new Set<string>();

        ((profiles ?? []) as ProfileRow[]).forEach((profile) => {
          const name = profile.group_name?.trim();
          if (name) groupNames.add(name.toLowerCase());
        });

        ((groups ?? []) as GroupRow[]).forEach((group) => {
          const name = group.name?.trim();
          if (name) groupNames.add(name.toLowerCase());
        });

        setUsersCount(count ?? 0);
        setGroupsCount(groupNames.size);
      } catch (error) {
        console.error("[Admin Stats] Could not load stats", error);
        setUsersCount(0);
        setGroupsCount(0);
      }
    }

    void loadStats();
  }, []);

  return (
    <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <Stat label="Users" value={usersCount} />
      <Stat label="Groups" value={groupsCount} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-slate-200 border-t-era-orange bg-white p-4 shadow-soft sm:p-5">
      <p className="text-sm font-bold uppercase text-era-teal">{label}</p>
      <p className="mt-2 text-3xl font-black text-era-navy">{value ?? "..."}</p>
    </div>
  );
}
