"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type ProfileRow = {
  group_name: string | null;
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
        const [
          { count, error: countError },
          { data: profiles, error: profilesError },
          { data: studentProfiles, error: studentProfilesError },
          { data: teacherProfiles, error: teacherProfilesError },
          { data: scheduleItems, error: scheduleItemsError }
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("profiles").select("group_name").eq("is_active", true),
          supabase.from("student_profiles").select("group_name"),
          supabase.from("teacher_profiles").select("group_name"),
          supabase.from("schedule_items").select("group_name").eq("is_active", true)
        ]);

        if (countError) throw countError;
        if (profilesError) throw profilesError;
        if (studentProfilesError) throw studentProfilesError;
        if (teacherProfilesError) throw teacherProfilesError;
        if (scheduleItemsError) throw scheduleItemsError;

        const groupNames = new Set<string>();
        [profiles, studentProfiles, teacherProfiles, scheduleItems].forEach((rows) => {
          ((rows ?? []) as ProfileRow[]).forEach((row) => {
            const name = row.group_name?.trim();
            if (name) groupNames.add(name.toLowerCase());
          });
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
      <Stat label="Active Groups" value={groupsCount} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-slate-200 border-t-era-orange bg-white p-4 shadow-soft sm:p-5">
      <p className="text-sm font-bold uppercase text-era-teal">{label}</p>
      {value === null ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-era-sky" aria-hidden="true" />
      ) : (
        <p className="mt-2 text-3xl font-black text-era-navy">{value}</p>
      )}
    </div>
  );
}
