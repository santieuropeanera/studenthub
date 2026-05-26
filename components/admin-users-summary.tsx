"use client";

import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import type { AppUser, Group } from "@/types/studenthub";

export function AdminUsersSummary({ users, groups }: { users: AppUser[]; groups: Group[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const groupName = groups.find((group) => group.id === user.groupId)?.name ?? "All groups";
      return [user.fullName, user.role, user.email, groupName].join(" ").toLowerCase().includes(query);
    });
  }, [groups, searchTerm, users]);

  return (
    <section id="users" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-era-navy sm:text-2xl">All Users</h2>
          <p className="mt-1 text-sm text-slate-600">{users.length} synced users across students, teachers, and admins.</p>
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
                    <td className="p-3">{groups.find((group) => group.id === user.groupId)?.name ?? "All groups"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length ? <p className="mt-3 text-sm text-slate-600">No users match your search.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
