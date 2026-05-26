"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BedDouble, BriefcaseBusiness, CalendarDays, ChevronDown, HeartPulse, Home, Phone, PhoneCall, Search, Siren, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { LogoutButton } from "@/components/logout-button";
import { LogoutTestButton } from "@/components/logout-test-button";
import { appConfig } from "@/lib/config";

type TeacherDashboardData = {
  teacher: {
    id: string;
    fullName: string;
    email: string;
    groupName: string;
  };
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    photoUrl?: string | null;
    phoneNumber?: string | null;
    accommodationName?: string | null;
    accommodationAddress?: string | null;
    workPlacementName?: string | null;
    workPlacementAddress?: string | null;
    workingHours?: string | null;
    hospitalName?: string | null;
  }>;
  scheduleItems: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    notes?: string | null;
  }>;
};

const teacherNav = [
  { href: "#home", label: "Home", icon: Home },
  { href: "#students", label: "Students", icon: UsersRound },
  { href: "#schedule", label: "Schedule", icon: CalendarDays },
  { href: "#emergency", label: "Emergency", icon: Siren }
];

const teacherMobileNav = [
  { href: "/teacher", label: "Dashboard", icon: Home },
  { href: "#students", label: "Students", icon: UsersRound },
  { href: "#schedule", label: "Schedule", icon: CalendarDays },
  { href: "#emergency", label: "Emergency Contact", icon: Siren }
];

function normalizeGroup(value?: string | null) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export default function TeacherPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeacherDashboard() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          setMessage("Supabase is not configured yet.");
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const {
          data: { user: authUser },
          error: authError
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        const normalizedEmail = authUser?.email?.trim().toLowerCase() ?? "";

        if (!normalizedEmail) {
          setMessage("Please sign in with a teacher account.");
          return;
        }

        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, group_id, school_id, group_name")
          .ilike("email", normalizedEmail)
          .eq("role", "teacher")
          .limit(1);

        if (profileError) throw profileError;

        const teacherProfile = profileRows?.find((item) => item.email?.trim().toLowerCase() === normalizedEmail);

        if (!teacherProfile) {
          setMessage("No teacher profile found for this account yet.");
          return;
        }

        const [{ data: teacherDetails }, { data: group }, { data: school }] = await Promise.all([
          supabase.from("teacher_profiles").select("group_name, group_id, school_id").eq("user_id", teacherProfile.id).maybeSingle(),
          teacherProfile.group_id ? supabase.from("groups").select("name").eq("id", teacherProfile.group_id).maybeSingle() : Promise.resolve({ data: null }),
          teacherProfile.school_id ? supabase.from("schools").select("name").eq("id", teacherProfile.school_id).maybeSingle() : Promise.resolve({ data: null })
        ]);

        const groupName =
          teacherDetails?.group_name?.trim() ||
          teacherProfile.group_name?.trim() ||
          group?.name?.trim() ||
          school?.name?.trim() ||
          "";

        if (!groupName) {
          setMessage("No group is assigned to this teacher account yet.");
          return;
        }

        const normalizedGroup = normalizeGroup(groupName);
        const { data: studentProfileRows, error: studentProfilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, group_name")
          .eq("role", "student");

        if (studentProfilesError) throw studentProfilesError;

        const studentsInGroup = (studentProfileRows ?? []).filter((student) => normalizeGroup(student.group_name) === normalizedGroup);

        const students = await Promise.all(
          studentsInGroup.map(async (student) => {
            const { data: studentProfile } = await supabase
              .from("student_profiles")
              .select("profile_photo_url, phone_number, internship_placement_id, accommodation_id, group_name")
              .eq("user_id", student.id)
              .maybeSingle();

            const { data: placement } = studentProfile?.internship_placement_id
              ? await supabase
                  .from("internship_placements")
                  .select("name, address, working_hours")
                  .eq("id", studentProfile.internship_placement_id)
                  .maybeSingle()
              : { data: null };

            const { data: accommodation } = studentProfile?.accommodation_id
              ? await supabase
                  .from("accommodations")
                  .select("name, address, hospital_medical_center_id")
                  .eq("id", studentProfile.accommodation_id)
                  .maybeSingle()
              : { data: null };

            const { data: hospital } = accommodation?.hospital_medical_center_id
              ? await supabase
                  .from("hospital_medical_centers")
                  .select("name")
                  .eq("id", accommodation.hospital_medical_center_id)
                  .maybeSingle()
              : { data: null };

            return {
              id: student.id,
              fullName: student.full_name,
              email: student.email,
              photoUrl: studentProfile?.profile_photo_url,
              phoneNumber: studentProfile?.phone_number,
              accommodationName: accommodation?.name,
              accommodationAddress: accommodation?.address,
              workPlacementName: placement?.name,
              workPlacementAddress: placement?.address,
              workingHours: placement?.working_hours,
              hospitalName: hospital?.name
            };
          })
        );

        const { data: scheduleRows, error: scheduleError } = await supabase
          .from("schedule_items")
          .select("id, group_name, title, date, time, notes")
          .order("date", { ascending: true })
          .order("time", { ascending: true });

        if (scheduleError) throw scheduleError;

        setData({
          teacher: {
            id: teacherProfile.id,
            fullName: teacherProfile.full_name,
            email: teacherProfile.email,
            groupName
          },
          students,
          scheduleItems: (scheduleRows ?? [])
            .filter((item) => normalizeGroup(item.group_name) === normalizedGroup)
            .map((item) => ({
              id: item.id,
              title: item.title,
              date: item.date,
              time: item.time,
              notes: item.notes
            }))
        });
      } catch (error) {
        console.error("[Teacher Dashboard] Could not load teacher dashboard", error);
        setMessage(error instanceof Error ? error.message : "Could not load teacher dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadTeacherDashboard();
  }, []);

  if (isLoading) {
    return (
      <>
        <LogoutTestButton />
        <DashboardShell title="Teacher Dashboard" subtitle="Loading teacher area." roleLabel="Teacher dashboard" navItems={teacherNav} mobileNavItems={teacherMobileNav}>
          <div className="mb-4 flex justify-end">
            <LogoutButton />
          </div>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-era-navy">Loading teacher dashboard...</p>
          </section>
        </DashboardShell>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <LogoutTestButton />
        <DashboardShell title="Teacher Dashboard" subtitle="Your teacher profile will appear here after it is synced from Google Sheets." roleLabel="Teacher dashboard" navItems={teacherNav} mobileNavItems={teacherMobileNav}>
          <div className="mb-4 flex justify-end">
            <LogoutButton />
          </div>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-era-navy">{message || "No teacher profile found for this account yet."}</p>
          </section>
        </DashboardShell>
      </>
    );
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStudents = data.students.filter((student) => {
    const searchableText = [
      student.fullName,
      student.accommodationName,
      student.workPlacementName
    ].join(" ").toLowerCase();

    return !normalizedSearch || searchableText.includes(normalizedSearch);
  });

  return (
    <>
      <LogoutTestButton />
      <DashboardShell
        title={`Hello, ${data.teacher.fullName}`}
        subtitle={`You are viewing students and schedule information for ${data.teacher.groupName}.`}
        roleLabel="Teacher dashboard"
        navItems={teacherNav}
        mobileNavItems={teacherMobileNav}
      >
      <div className="mb-4 flex justify-end">
        <LogoutButton />
      </div>
      <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <SummaryCard label="Teacher" value={data.teacher.fullName} />
        <SummaryCard label="Email" value={data.teacher.email} />
        <SummaryCard label="Group" value={data.teacher.groupName} />
      </section>

      <section id="students" className="mt-5 sm:mt-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black text-era-navy sm:text-2xl">Students</h2>
          <label className="relative block sm:w-80">
            <span className="sr-only">Search student</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
              type="search"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-2">
          {filteredStudents.length ? filteredStudents.map((student) => {
            const isExpanded = expandedStudentId === student.id;

            return (
              <article key={student.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
                <button
                  className="grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-3 text-left transition hover:bg-era-paper sm:grid-cols-[auto_1.3fr_1fr_1fr_auto]"
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                >
                  {student.photoUrl ? (
                    <img className="h-12 w-12 rounded-full border border-slate-200 object-cover" src={student.photoUrl} alt={`${student.fullName} profile photo`} />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-era-sky text-era-navy">
                      <UserRound className="h-6 w-6" aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-black text-era-navy">{student.fullName}</span>
                    <span className="block truncate text-xs text-slate-500 sm:hidden">
                      {student.accommodationName ?? "No accommodation"} / {student.workPlacementName ?? "No work placement"}
                    </span>
                  </span>
                  <span className="hidden min-w-0 truncate text-sm text-slate-700 sm:block">{student.accommodationName ?? "No accommodation"}</span>
                  <span className="hidden min-w-0 truncate text-sm text-slate-700 sm:block">{student.workPlacementName ?? "No work placement"}</span>
                  <span className="flex items-center gap-2 text-sm font-bold text-era-blue">
                    <span className="hidden sm:inline">{isExpanded ? "Hide" : "View details"}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                  </span>
                </button>

                {isExpanded ? (
                  <div className="grid gap-2 border-t border-slate-200 bg-era-paper p-3 transition-all sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <InfoLine icon={CalendarDays} label="Working hours" value={student.workingHours ?? "Not provided"} />
                    <InfoLine icon={HeartPulse} label="Assigned hospital" value={student.hospitalName ?? "Not assigned yet"} />
                    <InfoLine icon={Phone} label="Phone" value={student.phoneNumber ?? "Not provided"} />
                    <InfoLine icon={BedDouble} label="Accommodation address" value={student.accommodationAddress ?? "Address not available yet"} />
                    <InfoLine icon={BriefcaseBusiness} label="Work placement address" value={student.workPlacementAddress ?? "Address not available yet"} />
                  </div>
                ) : null}
              </article>
            );
          }) : data.students.length ? (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">No students match your search.</p>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">No students found for this group yet.</p>
          )}
        </div>
      </section>

      <section id="schedule" className="mt-5 sm:mt-6">
        <h2 className="mb-3 text-xl font-black text-era-navy sm:text-2xl">Schedule</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {data.scheduleItems.length ? data.scheduleItems.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
              <h3 className="mt-1 font-black text-era-navy">{item.title}</h3>
              <p className="mt-3 text-sm font-semibold">{item.date} - {item.time}</p>
              {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
            </article>
          )) : (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">No schedule items yet.</p>
          )}
        </div>
      </section>

      <section id="emergency" className="mt-5 rounded-lg border-2 border-red-600 bg-red-50 p-4 sm:mt-6 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Siren className="h-8 w-8 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-black text-red-700 sm:text-2xl">European Era Emergency</h2>
            <p className="mt-2 text-sm text-red-900">For urgent mobility support, contact European Era directly.</p>
            <a className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 font-black text-white sm:w-auto" href={`tel:${appConfig.emergencyPhone}`}>
              <PhoneCall className="h-5 w-5" aria-hidden="true" />
              Call European Era
            </a>
          </div>
        </div>
      </section>
      </DashboardShell>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <p className="text-sm font-bold uppercase text-era-teal">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-era-navy">{value}</p>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-md bg-era-paper p-3">
      <Icon className="h-5 w-5 shrink-0 text-era-blue" />
      <div>
        <p className="text-sm font-bold text-era-navy">{label}</p>
        <p className="text-sm text-slate-600">{value}</p>
      </div>
    </div>
  );
}
