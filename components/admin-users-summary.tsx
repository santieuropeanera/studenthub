"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, Power, Search, Trash2, UserRound, UsersRound } from "lucide-react";
import { LoadingCardSkeleton } from "@/components/loading-states";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  group_id: string | null;
  group_name: string | null;
  is_active: boolean | null;
  deactivated_at: string | null;
  deactivated_reason: string | null;
};

type StudentProfileRow = {
  user_id: string | null;
  group_name: string | null;
  phone_number: string | null;
  profile_photo_url: string | null;
  internship_placement_id: string | null;
  accommodation_id: string | null;
};

type TeacherProfileRow = {
  user_id: string | null;
  group_name: string | null;
};

type GroupRow = {
  id: string;
  name: string | null;
};

type PlacementRow = {
  id: string;
  name: string | null;
  address: string | null;
  working_hours: string | null;
};

type AccommodationRow = {
  id: string;
  name: string | null;
  address: string | null;
  hospital_medical_center_id: string | null;
};

type HospitalRow = {
  id: string;
  name: string | null;
};

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  groupName: string;
  phone: string;
  profilePhotoUrl: string | null;
  accommodationName: string;
  accommodationAddress: string;
  workPlacementName: string;
  workPlacementAddress: string;
  workingHours: string;
  hospitalName: string;
  isActive: boolean;
  deactivatedAt: string | null;
  deactivatedReason: string | null;
};

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function normalize(value?: string | null, fallback = "") {
  return value?.trim() || fallback;
}

function indexById<Row extends { id: string }>(rows: Row[] | null) {
  return (rows ?? []).reduce<Record<string, Row>>((lookup, row) => {
    lookup[row.id] = row;
    return lookup;
  }, {});
}

function indexByUserId<Row extends { user_id: string | null }>(rows: Row[] | null) {
  return (rows ?? []).reduce<Record<string, Row>>((lookup, row) => {
    if (row.user_id) lookup[row.user_id] = row;
    return lookup;
  }, {});
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && !["No group", "Not assigned"].includes(value)))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function AdminUsersSummary() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [placementFilter, setPlacementFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [message, setMessage] = useState("Loading users...");
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [
          { data: profiles, error: profilesError },
          { data: studentProfiles, error: studentProfilesError },
          { data: teacherProfiles, error: teacherProfilesError },
          { data: groups, error: groupsError },
          { data: placements, error: placementsError },
          { data: accommodations, error: accommodationsError },
          { data: hospitals, error: hospitalsError }
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, phone, role, group_id, group_name, is_active, deactivated_at, deactivated_reason").order("full_name", { ascending: true }),
          supabase.from("student_profiles").select("user_id, group_name, phone_number, profile_photo_url, internship_placement_id, accommodation_id"),
          supabase.from("teacher_profiles").select("user_id, group_name"),
          supabase.from("groups").select("id, name"),
          supabase.from("internship_placements").select("id, name, address, working_hours"),
          supabase.from("accommodations").select("id, name, address, hospital_medical_center_id"),
          supabase.from("hospital_medical_centers").select("id, name")
        ]);

        if (profilesError) throw profilesError;
        if (studentProfilesError) throw studentProfilesError;
        if (teacherProfilesError) throw teacherProfilesError;
        if (groupsError) throw groupsError;
        if (placementsError) throw placementsError;
        if (accommodationsError) throw accommodationsError;
        if (hospitalsError) throw hospitalsError;

        const studentsByUserId = indexByUserId((studentProfiles ?? []) as StudentProfileRow[]);
        const teachersByUserId = indexByUserId((teacherProfiles ?? []) as TeacherProfileRow[]);
        const groupsById = indexById((groups ?? []) as GroupRow[]);
        const placementsById = indexById((placements ?? []) as PlacementRow[]);
        const accommodationsById = indexById((accommodations ?? []) as AccommodationRow[]);
        const hospitalsById = indexById((hospitals ?? []) as HospitalRow[]);

        setUsers(
          ((profiles ?? []) as ProfileRow[]).map((profile) => {
            const studentProfile = studentsByUserId[profile.id];
            const teacherProfile = teachersByUserId[profile.id];
            const placement = studentProfile?.internship_placement_id ? placementsById[studentProfile.internship_placement_id] : null;
            const accommodation = studentProfile?.accommodation_id ? accommodationsById[studentProfile.accommodation_id] : null;
            const hospital = accommodation?.hospital_medical_center_id ? hospitalsById[accommodation.hospital_medical_center_id] : null;
            const detailGroupName = profile.role === "teacher" ? teacherProfile?.group_name : studentProfile?.group_name;
            const groupName = normalize(profile.group_name) || normalize(detailGroupName) || normalize(profile.group_id ? groupsById[profile.group_id]?.name : null, "No group");
            const phone = normalize(studentProfile?.phone_number) || normalize(profile.phone, "No phone");

            return {
              id: profile.id,
              fullName: normalize(profile.full_name, "Name not provided"),
              email: normalize(profile.email, "Email not provided"),
              role: normalize(profile.role, "unknown"),
              groupName,
              phone,
              profilePhotoUrl: studentProfile?.profile_photo_url ?? null,
              accommodationName: normalize(accommodation?.name, "Not assigned"),
              accommodationAddress: normalize(accommodation?.address, "Address not available"),
              workPlacementName: normalize(placement?.name, "Not assigned"),
              workPlacementAddress: normalize(placement?.address, "Address not available"),
              workingHours: normalize(placement?.working_hours, "Not provided"),
              hospitalName: normalize(hospital?.name, "Not assigned"),
              isActive: profile.is_active !== false,
              deactivatedAt: profile.deactivated_at,
              deactivatedReason: profile.deactivated_reason
            };
          })
        );
        setMessage("");
      } catch (error) {
        console.error("[Admin Users] Could not load users", error);
        setMessage(error instanceof Error ? error.message : "Could not load users.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadUsers();
  }, []);

  const groupOptions = useMemo(() => uniqueOptions(users.map((user) => user.groupName)), [users]);
  const placementOptions = useMemo(() => uniqueOptions(users.map((user) => user.workPlacementName)), [users]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) =>
      (showInactive || user.isActive) &&
      (!groupFilter || user.groupName === groupFilter) &&
      (!placementFilter || user.workPlacementName === placementFilter) &&
      (!query || [
        user.fullName,
        user.groupName,
        user.workPlacementName,
        user.phone,
        user.email,
        user.role,
        user.accommodationName,
        user.hospitalName
      ]
        .join(" ")
        .toLowerCase()
        .includes(query))
    );
  }, [groupFilter, placementFilter, searchTerm, showInactive, users]);

  function clearFilters() {
    setGroupFilter("");
    setPlacementFilter("");
  }

  async function authHeaders() {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) throw new Error("Please sign in as an admin.");
    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function runLifecycleAction(user: AdminUser, action: "deactivate" | "reactivate" | "delete") {
    let confirmation: string | null = null;

    if (action === "delete") {
      confirmation = window.prompt(`Type DELETE to permanently delete ${user.fullName}. This cannot be undone.`);
      if (confirmation !== "DELETE") return;
    } else if (!window.confirm(`${action === "deactivate" ? "Deactivate" : "Reactivate"} ${user.fullName}?`)) {
      return;
    }

    setActionUserId(user.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/lifecycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders())
        },
        body: JSON.stringify({ action, userId: user.id, confirmation })
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not update user.");
      }

      setMessage(body.message ?? "User updated.");
      if (action === "delete") {
        setUsers((current) => current.filter((item) => item.id !== user.id));
      } else {
        setUsers((current) =>
          current.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  isActive: action === "reactivate",
                  deactivatedAt: action === "deactivate" ? new Date().toISOString() : null,
                  deactivatedReason: action === "deactivate" ? "Manually deactivated by admin" : null
                }
              : item
          )
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update user.");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <section id="users" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-era-navy sm:text-2xl">All Users</h2>
          <p className="mt-1 text-sm text-slate-600">
            {message || `${users.filter((user) => user.isActive).length} active users loaded from Supabase.`}
          </p>
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
          {isLoading ? (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <LoadingCardSkeleton rows={3} />
              <LoadingCardSkeleton rows={3} />
            </div>
          ) : null}
          <div className="grid gap-3 rounded-md bg-era-paper p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-sm font-bold text-era-navy">
              Group
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
              >
                <option value="">All groups</option>
                {groupOptions.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-era-navy">
              Work Placement
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
                value={placementFilter}
                onChange={(event) => setPlacementFilter(event.target.value)}
              >
                <option value="">All work placements</option>
                {placementOptions.map((placement) => (
                  <option key={placement} value={placement}>{placement}</option>
                ))}
              </select>
            </label>
            <label className="relative grid gap-1 text-sm font-bold text-era-navy">
              Search
              <span className="sr-only">Search users</span>
              <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                className="min-h-11 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
                type="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button
              className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-era-navy hover:border-era-orange"
              type="button"
              onClick={clearFilters}
              disabled={!groupFilter && !placementFilter}
            >
              Clear filters
            </button>
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-era-navy md:col-span-4">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
              Show inactive users
            </label>
          </div>
          {!isLoading ? (
            <p className="mt-3 text-sm font-semibold text-era-navy">
              {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
            </p>
          ) : null}
          {!isLoading ? <div className="mt-4 overflow-x-auto rounded-md border border-slate-100">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-era-sky text-era-navy">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Work placement</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isExpanded = expandedUserId === user.id;

                  return (
                    <Fragment key={user.id}>
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-2 font-semibold leading-5">{user.fullName}</td>
                        <td className="px-3 py-2 leading-5">
                          <div className="flex flex-wrap items-center gap-2">
                            {user.groupName}
                            {!user.isActive ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Inactive</span> : null}
                          </div>
                        </td>
                        <td className="px-3 py-2 leading-5">{user.workPlacementName}</td>
                        <td className="px-3 py-2 leading-5">{user.phone}</td>
                        <td className="px-3 py-2">
                          <button
                            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-era-navy hover:border-era-orange"
                            type="button"
                            onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          >
                            {isExpanded ? "Hide" : "View"}
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="border-b border-slate-100 bg-era-paper">
                          <td className="px-3 py-3" colSpan={5}>
                            <UserDetails user={user} onLifecycleAction={runLifecycleAction} isBusy={actionUserId === user.id} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {!filteredUsers.length ? <p className="p-3 text-sm text-slate-600">No users match your search.</p> : null}
          </div> : null}
        </div>
      ) : null}
    </section>
  );
}

function UserDetails({
  user,
  onLifecycleAction,
  isBusy
}: {
  user: AdminUser;
  onLifecycleAction: (user: AdminUser, action: "deactivate" | "reactivate" | "delete") => void;
  isBusy: boolean;
}) {
  const actions = (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-era-navy disabled:opacity-60"
        type="button"
        disabled={isBusy || user.role === "admin"}
        onClick={() => onLifecycleAction(user, user.isActive ? "deactivate" : "reactivate")}
      >
        <Power className="h-3.5 w-3.5" aria-hidden="true" />
        {user.isActive ? "Deactivate" : "Reactivate"}
      </button>
      <button
        className="inline-flex min-h-9 items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        type="button"
        disabled={isBusy || user.role === "admin"}
        onClick={() => onLifecycleAction(user, "delete")}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Delete permanently
      </button>
    </div>
  );

  if (user.role === "student") {
    return (
      <div>
        <div className="grid gap-3 md:grid-cols-[auto_1fr]">
          {user.profilePhotoUrl ? (
            <img className="h-16 w-16 rounded-lg border border-slate-200 object-cover" src={user.profilePhotoUrl} alt={`${user.fullName} profile photo`} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white text-era-navy">
              <UserRound className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
          <dl className="grid gap-2 text-sm md:grid-cols-3">
            <Detail label="Email" value={user.email} />
            <Detail label="Role" value={user.role} />
            <Detail label="Status" value={user.isActive ? "Active" : `Inactive${user.deactivatedReason ? ` - ${user.deactivatedReason}` : ""}`} />
            <Detail label="Accommodation" value={user.accommodationName} />
            <Detail label="Accommodation address" value={user.accommodationAddress} />
            <Detail label="Work placement" value={user.workPlacementName} />
            <Detail label="Work placement address" value={user.workPlacementAddress} />
            <Detail label="Working hours" value={user.workingHours} />
            <Detail label="Assigned hospital" value={user.hospitalName} />
            <Detail label="Phone" value={user.phone} />
          </dl>
        </div>
        {actions}
      </div>
    );
  }

  if (user.role === "teacher") {
    return (
      <div>
        <dl className="grid gap-2 text-sm md:grid-cols-3">
          <Detail label="Email" value={user.email} />
          <Detail label="Role" value={user.role} />
          <Detail label="Status" value={user.isActive ? "Active" : `Inactive${user.deactivatedReason ? ` - ${user.deactivatedReason}` : ""}`} />
          <Detail label="Group" value={user.groupName} />
          <Detail label="Phone" value={user.phone} />
        </dl>
        {actions}
      </div>
    );
  }

  return (
    <div>
      <dl className="grid gap-2 text-sm md:grid-cols-3">
        <Detail label="Email" value={user.email} />
        <Detail label="Role" value={user.role} />
        <Detail label="Status" value={user.isActive ? "Active" : "Inactive"} />
      </dl>
      {actions}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <dt className="font-bold text-era-navy">{label}</dt>
      <dd className="mt-1 text-slate-700">{value}</dd>
    </div>
  );
}
