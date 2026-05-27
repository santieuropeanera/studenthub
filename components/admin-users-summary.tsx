"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, Search, UserRound, UsersRound } from "lucide-react";
import { LoadingCardSkeleton } from "@/components/loading-states";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  group_id: string | null;
  group_name: string | null;
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

export function AdminUsersSummary() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("Loading users...");
  const [isLoading, setIsLoading] = useState(true);

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
          supabase.from("profiles").select("id, full_name, email, phone, role, group_id, group_name").order("full_name", { ascending: true }),
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
              hospitalName: normalize(hospital?.name, "Not assigned")
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

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [
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
        .includes(query)
    );
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
          {isLoading ? (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <LoadingCardSkeleton rows={3} />
              <LoadingCardSkeleton rows={3} />
            </div>
          ) : null}
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
          {!isLoading ? <div className="mt-4 overflow-x-auto rounded-md border border-slate-100">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-era-sky text-era-navy">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Work placement</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isExpanded = expandedUserId === user.id;

                  return (
                    <Fragment key={user.id}>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-semibold">{user.fullName}</td>
                        <td className="p-3">{user.groupName}</td>
                        <td className="p-3">{user.workPlacementName}</td>
                        <td className="p-3">{user.phone}</td>
                        <td className="p-3">
                          <button
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy hover:border-era-orange"
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
                          <td className="p-4" colSpan={5}>
                            <UserDetails user={user} />
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

function UserDetails({ user }: { user: AdminUser }) {
  if (user.role === "student") {
    return (
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        {user.profilePhotoUrl ? (
          <img className="h-24 w-24 rounded-lg border border-slate-200 object-cover" src={user.profilePhotoUrl} alt={`${user.fullName} profile photo`} />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white text-era-navy">
            <UserRound className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <Detail label="Email" value={user.email} />
          <Detail label="Role" value={user.role} />
          <Detail label="Accommodation" value={user.accommodationName} />
          <Detail label="Accommodation address" value={user.accommodationAddress} />
          <Detail label="Work placement" value={user.workPlacementName} />
          <Detail label="Work placement address" value={user.workPlacementAddress} />
          <Detail label="Working hours" value={user.workingHours} />
          <Detail label="Assigned hospital" value={user.hospitalName} />
          <Detail label="Phone" value={user.phone} />
        </dl>
      </div>
    );
  }

  if (user.role === "teacher") {
    return (
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <Detail label="Email" value={user.email} />
        <Detail label="Role" value={user.role} />
        <Detail label="Group" value={user.groupName} />
        <Detail label="Phone" value={user.phone} />
      </dl>
    );
  }

  return (
    <dl className="grid gap-3 text-sm md:grid-cols-2">
      <Detail label="Email" value={user.email} />
      <Detail label="Role" value={user.role} />
    </dl>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <dt className="font-bold text-era-navy">{label}</dt>
      <dd className="mt-1 text-slate-700">{value}</dd>
    </div>
  );
}
