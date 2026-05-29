"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LoadingSpinner } from "@/components/loading-states";

type GroupNameRow = {
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

function addGroupNames(groupNames: Map<string, string>, rows: GroupNameRow[] | null) {
  (rows ?? []).forEach((row) => {
    const name = row.group_name?.trim();
    if (name) groupNames.set(name.toLowerCase(), name);
  });
}

export function AdminActiveGroups() {
  const [groups, setGroups] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading active groups...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [
          { data: profiles, error: profilesError },
          { data: studentProfiles, error: studentProfilesError },
          { data: teacherProfiles, error: teacherProfilesError },
          { data: scheduleItems, error: scheduleItemsError }
        ] = await Promise.all([
          supabase.from("profiles").select("group_name").eq("is_active", true),
          supabase.from("student_profiles").select("group_name"),
          supabase.from("teacher_profiles").select("group_name"),
          supabase.from("schedule_items").select("group_name").eq("is_active", true)
        ]);

        if (profilesError) throw profilesError;
        if (studentProfilesError) throw studentProfilesError;
        if (teacherProfilesError) throw teacherProfilesError;
        if (scheduleItemsError) throw scheduleItemsError;

        const groupNames = new Map<string, string>();
        addGroupNames(groupNames, profiles);
        addGroupNames(groupNames, studentProfiles);
        addGroupNames(groupNames, teacherProfiles);
        addGroupNames(groupNames, scheduleItems);

        setGroups(Array.from(groupNames.values()).sort((a, b) => a.localeCompare(b)));
        setMessage("");
      } catch (error) {
        console.error("[Admin Active Groups] Could not load active groups", error);
        setMessage(error instanceof Error ? error.message : "Could not load active groups.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadGroups();
  }, []);

  return (
    <section id="groups" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-era-navy sm:text-2xl">Active Groups</h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLoading ? <LoadingSpinner label="Loading active groups..." /> : message || `${groups.length} active ${groups.length === 1 ? "group" : "groups"} found.`}
          </p>
        </div>
      </div>

      {groups.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {groups.map((group) => (
            <span key={group} className="rounded-md border border-era-orange bg-era-sky px-3 py-2 text-sm font-bold text-era-navy">
              {group}
            </span>
          ))}
        </div>
      ) : !message ? (
        <p className="mt-4 rounded-md bg-era-paper p-4 text-sm text-slate-600">No active groups found.</p>
      ) : null}
    </section>
  );
}
