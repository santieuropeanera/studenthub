"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, UsersRound } from "lucide-react";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  group_id: string | null;
  group_name: string | null;
};

type GroupRow = {
  id: string;
  name: string | null;
};

type ProfileDetailsRow = {
  user_id: string | null;
  group_name: string | null;
};

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  groupName: string;
};

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function normalize(value?: string | null) {
  return value?.trim() || "";
}

function indexByUserId(rows: ProfileDetailsRow[] | null) {
  return (rows ?? []).reduce<Record<string, ProfileDetailsRow>>((lookup, row) => {
    if (row.user_id) lookup[row.user_id] = row;
    return lookup;
  }, {});
}

export function AdminUsersSummary() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("Loading users...");

  useEffect(() => {
    async function loadUsers() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [
          { data: profiles, error: profilesError },
          { data: studentProfiles, error: studentProfilesError },
          { data: teacherProfiles, error: teacherProfilesError },
          { data: groups, error: groupsError }
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, role, group_id, group_name").order("full_name", { ascending: true }),
          supabase.from("student_profiles").select("user_id, group_name"),
          supabase.from("teacher_profiles").select("user_id, group_name"),
          supabase.from("groups").select("id, name")
        ]);

        if (profilesError) throw profilesError;
        if (studentProfilesError) throw studentProfilesError;
        if (teacherProfilesError) throw teacherProfilesError;
        if (groupsError) throw groupsError;

        const studentByUserId = indexByUserId(studentProfiles);
        const teacherByUserId = indexByUserId(teacherProfiles);
        const groupsById = ((groups ?? []) as GroupRow[]).reduce<Record<string, GroupRow>>((lookup, group) => {
          lookup[group.id] = group;
          return lookup;
        }, {});

        setUsers(
          ((profiles ?? []) as ProfileRow[]).map((profile) => {
            const fallbackGroup = profile.role === "teacher" ? teacherByUserId[profile.id] : studentByUserId[profile.id];
            const groupName = normalize(profile.group_name) || normalize(fallbackGroup?.group_name) || normalize(profile.group_id ? groupsById[profile.group_id]?.name : null);

            return {
              id: profile.id,
              fullName: normalize(profile.full_name) || "Name not provided",
              email: normalize(profile.email) || "Email not provided",
              role: normalize(profile.role) || "unknown",
              groupName: groupName || "No group"
            };
          })
        );
        setMessage("");
      } catch (error) {
        console.error("[Admin Users] Could not load users", error);
        setMessage(error instanceof Error ? error.message : "Could not load users.");
      }
    }

    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => [user.fullName, user.role, user.email, user.groupName].join(" ").toLowerCase().includes(query));
  }, [searchTerm, users]);

  return (
    <section id="users" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-era-navy sm:text-2xl">All Users</h2>
          <p className="mt-1 text-sm text-slate-600">{message || `${users.length} real users loaded from Supabase.`}</p>
        </div>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy sm:w-fit"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          {isOpen ? "Hide users" : "View all users"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4">
          <label className="relative block max-w-sm">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
              type="search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="mt-4 overflow-x-auto rounded-md border border-slate-100">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-era-sky text-era-navy">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Group</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="p-3 font-semibold">{user.fullName}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.groupName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length ? <p className="p-3 text-sm text-slate-600">No users match your search.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
