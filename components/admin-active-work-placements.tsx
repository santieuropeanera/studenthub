"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BriefcaseBusiness, ChevronDown, Search } from "lucide-react";
import { LoadingCardSkeleton } from "@/components/loading-states";

type ProfileRow = {
  id: string;
  role: string | null;
  group_name: string | null;
  is_active: boolean | null;
};

type StudentProfileRow = {
  user_id: string | null;
  group_name: string | null;
  internship_placement_id: string | null;
};

type PlacementRow = {
  id: string;
  name: string | null;
};

type PlacementSummary = {
  id: string;
  name: string;
  studentCount: number;
  groupNames: string[];
};

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function AdminActiveWorkPlacements() {
  const [placements, setPlacements] = useState<PlacementSummary[]>([]);
  const [message, setMessage] = useState("Loading active work placements...");
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadPlacements() {
      try {
        const supabase = createSupabaseBrowserClient();
        const [
          { data: profiles, error: profilesError },
          { data: studentProfiles, error: studentProfilesError },
          { data: placementRows, error: placementsError }
        ] = await Promise.all([
          supabase.from("profiles").select("id, role, group_name, is_active").eq("role", "student").eq("is_active", true),
          supabase.from("student_profiles").select("user_id, group_name, internship_placement_id"),
          supabase.from("internship_placements").select("id, name")
        ]);

        if (profilesError) throw profilesError;
        if (studentProfilesError) throw studentProfilesError;
        if (placementsError) throw placementsError;

        const activeStudents = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
        const placementsById = new Map(((placementRows ?? []) as PlacementRow[]).map((placement) => [placement.id, placement]));
        const summaries = new Map<string, PlacementSummary>();

        ((studentProfiles ?? []) as StudentProfileRow[]).forEach((studentProfile) => {
          if (!studentProfile.user_id || !studentProfile.internship_placement_id) return;

          const profile = activeStudents.get(studentProfile.user_id);
          if (!profile) return;

          const placement = placementsById.get(studentProfile.internship_placement_id);
          if (!placement) return;

          const existing = summaries.get(studentProfile.internship_placement_id) ?? {
            id: studentProfile.internship_placement_id,
            name: placement.name?.trim() || "Unnamed work placement",
            studentCount: 0,
            groupNames: []
          };

          const groupName = studentProfile.group_name?.trim() || profile.group_name?.trim();
          existing.studentCount += 1;
          if (groupName && !existing.groupNames.includes(groupName)) {
            existing.groupNames.push(groupName);
          }

          summaries.set(studentProfile.internship_placement_id, existing);
        });

        setPlacements(
          Array.from(summaries.values()).sort((a, b) => b.studentCount - a.studentCount || a.name.localeCompare(b.name))
        );
        setMessage("");
      } catch (error) {
        console.error("[Admin Active Work Placements] Could not load placements", error);
        setMessage(error instanceof Error ? error.message : "Could not load active work placements.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPlacements();
  }, []);

  const totalAssignedStudents = useMemo(
    () => placements.reduce((total, placement) => total + placement.studentCount, 0),
    [placements]
  );
  const filteredPlacements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return placements;

    return placements.filter((placement) => placement.name.toLowerCase().includes(query));
  }, [placements, searchTerm]);
  const resultLabel = searchTerm.trim()
    ? `${filteredPlacements.length} ${filteredPlacements.length === 1 ? "placement" : "placements"} found`
    : `${placements.length} active ${placements.length === 1 ? "work placement" : "work placements"}`;

  return (
    <section id="work-placements" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-era-navy sm:text-2xl">
            <BriefcaseBusiness className="h-5 w-5 text-era-blue" aria-hidden="true" />
            Active Work Placements
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLoading
              ? message
              : `${placements.length} active ${placements.length === 1 ? "work placement" : "work placements"} with ${totalAssignedStudents} active ${totalAssignedStudents === 1 ? "student" : "students"} assigned.`}
          </p>
        </div>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy sm:w-fit"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          {isOpen ? "Hide placements" : "View placements"}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4">
          {isLoading ? (
            <LoadingCardSkeleton rows={4} />
          ) : placements.length ? (
            <>
              <div className="grid gap-2 rounded-md bg-era-paper p-3">
                <label className="relative grid gap-1 text-sm font-bold text-era-navy">
                  Search
                  <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    className="min-h-11 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
                    type="search"
                    placeholder="Search work placements..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>
                <p className="text-sm font-semibold text-era-navy">{resultLabel}</p>
              </div>

              <div className="mt-4 overflow-x-auto rounded-md border border-slate-100">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-era-sky text-era-navy">
                    <tr>
                      <th className="px-3 py-2">Work placement</th>
                      <th className="px-3 py-2">Active students</th>
                      <th className="px-3 py-2">Groups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlacements.map((placement) => (
                      <tr key={placement.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 font-semibold text-era-navy">{placement.name}</td>
                        <td className="px-3 py-2">{placement.studentCount}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {placement.groupNames.length ? placement.groupNames.sort((a, b) => a.localeCompare(b)).join(", ") : "No group"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredPlacements.length ? <p className="p-3 text-sm text-slate-600">No work placements match your search.</p> : null}
              </div>
            </>
          ) : (
            <p className="rounded-md bg-era-paper p-4 text-sm text-slate-600">No active work placements found.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
