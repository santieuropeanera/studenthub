"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BedDouble, BriefcaseBusiness, CalendarDays, HeartPulse, Home, ImageIcon, QrCode, Siren, SmilePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { LoadingCardSkeleton } from "@/components/loading-states";

type ScheduleItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  notes?: string | null;
};

const studentNav = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student#internship", label: "My Internship", icon: BriefcaseBusiness },
  { href: "/student#accommodation", label: "My Accommodation", icon: BedDouble },
  { href: "/student#medical", label: "Medical Help", icon: HeartPulse },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/activities", label: "Activities", icon: ImageIcon },
  { href: "/student/support", label: "Student Support", icon: SmilePlus },
  { href: "/student#emergency", label: "Emergency", icon: Siren }
];

const studentMobileNav = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/activities", label: "Activities", icon: ImageIcon },
  { href: "/student/support", label: "Student Support", icon: SmilePlus },
  { href: "/student#emergency", label: "Emergency QR Card", icon: QrCode },
  { href: "/student#medical", label: "Medical Help", icon: HeartPulse },
  { href: "/student#accommodation", label: "Accommodation", icon: BedDouble },
  { href: "/student#internship", label: "Internship", icon: BriefcaseBusiness }
];

function normalizeGroup(value?: string | null) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export default function StudentSchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("Loading schedule...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          setMessage("Supabase is not configured yet.");
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const email = authData.user?.email?.trim().toLowerCase();
        if (!email) {
          setMessage("Please sign in to view your schedule.");
          return;
        }

        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, group_id, school_id")
          .ilike("email", email)
          .eq("role", "student")
          .limit(1);
        if (profileError) throw profileError;

        const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === email);
        if (!profile) {
          setMessage("No student profile found for this account yet.");
          return;
        }

        const [{ data: studentProfile }, { data: profileGroup }, { data: group }, { data: school }] = await Promise.all([
          supabase.from("student_profiles").select("group_name").eq("user_id", profile.id).maybeSingle(),
          supabase.from("profiles").select("group_name").eq("id", profile.id).maybeSingle(),
          profile.group_id ? supabase.from("groups").select("name").eq("id", profile.group_id).maybeSingle() : Promise.resolve({ data: null }),
          profile.school_id ? supabase.from("schools").select("name").eq("id", profile.school_id).maybeSingle() : Promise.resolve({ data: null })
        ]);

        const resolvedGroupName = studentProfile?.group_name?.trim() || profileGroup?.group_name?.trim() || group?.name?.trim() || school?.name?.trim() || "";
        setGroupName(resolvedGroupName);

        const { data: scheduleRows, error: scheduleError } = await supabase
          .from("schedule_items")
          .select("id, group_name, title, date, time, notes")
          .eq("is_active", true)
          .order("date", { ascending: true })
          .order("time", { ascending: true });
        if (scheduleError) throw scheduleError;

        const normalizedGroup = normalizeGroup(resolvedGroupName);
        setItems(
          (scheduleRows ?? [])
            .filter((item) => normalizeGroup(item.group_name) === normalizedGroup)
            .map((item) => ({ id: item.id, title: item.title, date: item.date, time: item.time, notes: item.notes }))
        );
        setMessage("");
      } catch (error) {
        console.error("[Student Schedule] Could not load schedule", error);
        setMessage(error instanceof Error ? error.message : "Could not load schedule.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSchedule();
  }, []);

  return (
    <DashboardShell
      title="Schedule"
      subtitle={groupName ? `Schedule for ${groupName}.` : "Your group schedule."}
      roleLabel="Student dashboard"
      navItems={studentNav}
      mobileNavItems={studentMobileNav}
    >
      <Link className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy sm:w-auto" href="/student">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <section className="grid gap-3 md:grid-cols-2">
        {isLoading ? (
          <>
            <LoadingCardSkeleton rows={3} />
            <LoadingCardSkeleton rows={3} />
          </>
        ) : items.length ? items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <h2 className="font-black text-era-navy">{item.title}</h2>
            <p className="mt-3 text-sm font-semibold">{item.date} - {item.time}</p>
            {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
          </article>
        )) : (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">{message || "No schedule items yet."}</p>
        )}
      </section>
    </DashboardShell>
  );
}
