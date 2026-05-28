"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, BedDouble, BriefcaseBusiness, CalendarDays, HeartPulse, Home, ImageIcon, QrCode, Siren, SmilePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { LoadingCardSkeleton } from "@/components/loading-states";
import { WhatsAppButton } from "@/components/whatsapp-button";

type ActivityItem = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  minimumParticipants?: number | null;
  ageRequirement?: string | null;
  imageUrl?: string | null;
  whatsappBookingUrl?: string | null;
};

function formatMinimumParticipants(value?: number | string | null) {
  const minimum = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(minimum) || minimum <= 0) {
    return "No minimum participants required";
  }

  return `Minimum participants: ${minimum} ${minimum === 1 ? "person" : "people"}`;
}

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

export default function StudentActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [studentName, setStudentName] = useState("Student");
  const [message, setMessage] = useState("Loading activities...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
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
          setMessage("Please sign in to view activities.");
          return;
        }

        const { data: profileRows } = await supabase
          .from("profiles")
          .select("full_name, email")
          .ilike("email", email)
          .eq("role", "student")
          .limit(1);
        const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === email);
        if (profile?.full_name) setStudentName(profile.full_name);

        const { data, error } = await supabase
          .from("activities")
          .select("id, title, description, category, minimum_participants, age_requirement, image_url, whatsapp_booking_url, is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setActivities(
          (data ?? []).map((activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            category: activity.category,
            minimumParticipants: activity.minimum_participants,
            ageRequirement: activity.age_requirement,
            imageUrl: activity.image_url?.trim() || null,
            whatsappBookingUrl: activity.whatsapp_booking_url
          }))
        );
        setMessage("");
      } catch (error) {
        console.error("[Student Activities] Could not load activities", error);
        setMessage(error instanceof Error ? error.message : "Could not load activities.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadActivities();
  }, []);

  return (
    <DashboardShell
      title="Activities"
      subtitle="Browse available European Era activities and book by WhatsApp."
      roleLabel="Student dashboard"
      navItems={studentNav}
      mobileNavItems={studentMobileNav}
    >
      <Link className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy sm:w-auto" href="/student">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <div className="mb-5 rounded-lg border border-era-orange bg-era-sky p-4 text-sm font-bold leading-6 text-era-navy">
        Please reserve all activities at least 48 hours in advance.
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <LoadingCardSkeleton rows={4} />
            <LoadingCardSkeleton rows={4} />
          </>
        ) : activities.length ? activities.map((activity) => (
          <article key={activity.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
            {activity.imageUrl && !failedImages[activity.id] ? (
              <div className="relative h-44 bg-era-sky sm:h-52">
                {!loadedImages[activity.id] ? <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-era-sky via-white to-era-sky" aria-hidden="true" /> : null}
                <img
                  className={`h-full w-full object-cover transition-opacity duration-300 ${loadedImages[activity.id] ? "opacity-100" : "opacity-0"}`}
                  src={activity.imageUrl}
                  alt={activity.title}
                  onLoad={() => setLoadedImages((current) => ({ ...current, [activity.id]: true }))}
                  onError={() => setFailedImages((current) => ({ ...current, [activity.id]: true }))}
                />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center bg-era-sky text-sm font-bold text-era-navy">Image not available</div>
            )}
            <div className="p-4 sm:p-5">
              {activity.category ? <span className="rounded-md bg-era-orange px-2 py-1 text-xs font-black uppercase text-era-ink">{activity.category}</span> : null}
              <h2 className="mt-3 text-xl font-black text-era-navy">{activity.title}</h2>
              {activity.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{activity.description}</p> : null}
              <div className="mt-4 grid gap-2 text-sm">
                <p>{formatMinimumParticipants(activity.minimumParticipants)}</p>
                {activity.ageRequirement ? <p><strong>Age requirement:</strong> {activity.ageRequirement}</p> : null}
              </div>
              {activity.whatsappBookingUrl ? (
                <a className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#24d366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1fb85a] sm:w-auto" href={activity.whatsappBookingUrl} target="_blank" rel="noreferrer">
                  Book by WhatsApp
                </a>
              ) : (
                <WhatsAppButton className="mt-4 w-full sm:w-auto" label="Book by WhatsApp" message={`Hi European Era, I would like to book this activity: ${activity.title}. My name is ${studentName}.`} />
              )}
            </div>
          </article>
        )) : (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">{message || "No activities found yet."}</p>
        )}
      </section>
    </DashboardShell>
  );
}
