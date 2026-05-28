"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  BedDouble,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  HeartPulse,
  Home,
  ImageIcon,
  MapPin,
  PhoneCall,
  QrCode,
  Siren,
  SmilePlus,
  Upload,
  UserRound
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { InfoCard } from "@/components/info-card";
import { LoadingButtonContent, LoadingDashboardSkeleton } from "@/components/loading-states";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { appConfig } from "@/lib/config";

type SupabaseBrowserClient = ReturnType<typeof createClient<any, "public", any>>;
type RelatedRecord = {
  id?: string | null;
  name: string;
  address?: string | null;
  maps_url?: string | null;
  google_maps_url?: string | null;
  working_hours?: string | null;
  emergency_phone?: string | null;
  hospital_medical_center_id?: string | null;
  hospital_external_key?: string | null;
  hospital_name?: string | null;
};

type StudentDashboardData = {
  user: { id: string; fullName: string; email: string };
  profile: {
    phoneNumber?: string | null;
    profilePhotoUrl?: string | null;
    emergencyPublicToken?: string | null;
    emergencyCardEnabled?: boolean;
  };
  group?: { id: string; name: string } | null;
  internship?: { name: string; address?: string | null; mapsUrl?: string | null; workingHours?: string | null } | null;
  accommodation?: { name: string; address?: string | null; emergencyPhone?: string | null; mapsUrl?: string | null } | null;
  hospital?: { name: string; address?: string | null; mapsUrl?: string | null } | null;
  scheduleItems: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    notes?: string | null;
  }>;
  activities: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  }>;
};

const studentNav = [
  { href: "#home", label: "Home", icon: Home },
  { href: "#internship", label: "My Internship", icon: BriefcaseBusiness },
  { href: "#accommodation", label: "My Accommodation", icon: BedDouble },
  { href: "#medical", label: "Medical Help", icon: HeartPulse },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/activities", label: "Activities", icon: ImageIcon },
  { href: "/student/support", label: "Student Support", icon: SmilePlus },
  { href: "#emergency", label: "Emergency", icon: Siren }
];

const studentMobileNav = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/activities", label: "Activities", icon: ImageIcon },
  { href: "/student/support", label: "Student Support", icon: SmilePlus },
  { href: "#emergency", label: "Emergency QR Card", icon: QrCode },
  { href: "#medical", label: "Medical Help", icon: HeartPulse },
  { href: "#accommodation", label: "Accommodation", icon: BedDouble },
  { href: "#internship", label: "Internship", icon: BriefcaseBusiness }
];

const medicalSteps = [
  "Check which hospital or medical center you should visit. This will vary depending on where you are staying.",
  "Make sure you have your European Health Insurance Card, or an equivalent health insurance document, and your passport with you.",
  "Go to your profile to check which hospital or medical center you should visit. This will vary depending on where you are staying.",
  "Head to the designated location. If you need help finding your way, don't hesitate to let us know - our team will be happy to assist and guide you.",
  'Once you arrive, go to the Recepcion desk and ask for a "Cita No Demorable" or urgent appointment. We recommend that you write down your symptoms in a translation app beforehand so you can show them easily if needed.',
  "Wait for your turn or until your name is called, and be patient - you'll be seen soon. Best of luck! :)"
];

function normalizeScheduleGroup(value?: string | null) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function createEmergencyToken() {
  return `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().slice(0, 8)}`;
}

function saveEmergencyCard() {
  document.body.classList.add("printing-emergency-card");
  window.print();
  window.setTimeout(() => document.body.classList.remove("printing-emergency-card"), 500);
}

async function loadRecordWithMapUrl(supabase: SupabaseBrowserClient, table: string, id: string, baseColumns: string) {
  const mapsUrlResult = await supabase
    .from(table)
    .select(`${baseColumns}, maps_url`)
    .eq("id", id)
    .maybeSingle();

  if (!mapsUrlResult.error) {
    return mapsUrlResult.data as RelatedRecord | null;
  }

  console.error(`[Student Dashboard] ${table} maps_url query error:`, mapsUrlResult.error);

  const googleMapsUrlResult = await supabase
    .from(table)
    .select(`${baseColumns}, google_maps_url`)
    .eq("id", id)
    .maybeSingle();

  if (googleMapsUrlResult.error) {
    console.error(`[Student Dashboard] ${table} google_maps_url query error:`, googleMapsUrlResult.error);
    return null;
  }

  return googleMapsUrlResult.data as RelatedRecord | null;
}

async function loadRecordWithOptionalMapUrl(supabase: SupabaseBrowserClient, table: string, id: string, baseColumns: string) {
  const baseResult = await supabase
    .from(table)
    .select(baseColumns)
    .eq("id", id)
    .maybeSingle();

  if (baseResult.error || !baseResult.data) {
    console.error(`[Student Dashboard] ${table} base query error:`, baseResult.error);
    return null;
  }

  const record = baseResult.data as unknown as RelatedRecord;

  const mapsUrlResult = await supabase
    .from(table)
    .select("maps_url")
    .eq("id", id)
    .maybeSingle();

  if (!mapsUrlResult.error && mapsUrlResult.data) {
    record.maps_url = (mapsUrlResult.data as { maps_url?: string | null }).maps_url;
    return record;
  }

  const googleMapsUrlResult = await supabase
    .from(table)
    .select("google_maps_url")
    .eq("id", id)
    .maybeSingle();

  if (!googleMapsUrlResult.error && googleMapsUrlResult.data) {
    record.google_maps_url = (googleMapsUrlResult.data as { google_maps_url?: string | null }).google_maps_url;
  }

  return record;
}

async function loadRecordWithDebug(supabase: SupabaseBrowserClient, table: string, id: string, baseColumns: string) {
  const record = await loadRecordWithOptionalMapUrl(supabase, table, id, baseColumns);

  if (record) {
    return { record, errorMessage: null };
  }

  const { error } = await supabase
    .from(table)
    .select(baseColumns)
    .eq("id", id)
    .maybeSingle();

  return {
    record: null,
    errorMessage: error ? `${error.message}${error.code ? ` (${error.code})` : ""}` : null
  };
}

async function loadOptionalColumn(supabase: SupabaseBrowserClient, table: string, id: string, column: string) {
  return loadOptionalColumnByField(supabase, table, "id", id, column);
}

async function loadOptionalColumnByField(supabase: SupabaseBrowserClient, table: string, matchColumn: string, matchValue: string, column: string) {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq(matchColumn, matchValue)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error(`[Student Dashboard] optional ${table}.${column} query error:`, error);
    }
    return null;
  }

  return (data as unknown as Record<string, any>)[column] ?? null;
}

async function loadHospitalForAccommodation(supabase: SupabaseBrowserClient, accommodation: RelatedRecord | null) {
  if (!accommodation) {
    return null;
  }

  const hospitalId =
    accommodation.hospital_medical_center_id ??
    (accommodation.id ? await loadOptionalColumn(supabase, "accommodations", accommodation.id, "hospital_medical_center_id") : null);

  if (hospitalId) {
    const hospital = await loadRecordWithOptionalMapUrl(supabase, "hospital_medical_centers", hospitalId, "id, name, address");
    if (hospital) {
      return hospital;
    }
  }

  const hospitalExternalKey =
    accommodation.hospital_external_key ??
    (accommodation.id ? await loadOptionalColumn(supabase, "accommodations", accommodation.id, "hospital_external_key") : null);

  if (hospitalExternalKey) {
    const { data, error } = await supabase
      .from("hospital_medical_centers")
      .select("name, address, maps_url")
      .eq("external_key", hospitalExternalKey)
      .maybeSingle();

    if (error) {
      console.error("[Student Dashboard] hospital lookup by external_key error:", error);
    } else if (data) {
      return data as RelatedRecord;
    }
  }

  const hospitalName =
    accommodation.hospital_name ??
    (accommodation.id ? await loadOptionalColumn(supabase, "accommodations", accommodation.id, "hospital_name") : null);

  if (hospitalName) {
    const { data, error } = await supabase
      .from("hospital_medical_centers")
      .select("name, address, maps_url")
      .eq("name", hospitalName)
      .maybeSingle();

    if (error) {
      console.error("[Student Dashboard] hospital lookup by name error:", error);
    } else if (data) {
      return data as RelatedRecord;
    }
  }

  return null;
}

export default function StudentPage() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isMedicalGuideOpen, setIsMedicalGuideOpen] = useState(false);
  const [isEmergencyCardOpen, setIsEmergencyCardOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    loadStudentData();
  }, []);

  async function loadStudentData() {
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
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const normalizedEmail = authUser?.email?.trim().toLowerCase() ?? "";
      console.log("[Student Dashboard] Searching student profile for email:", normalizedEmail);

      if (!normalizedEmail) {
        console.log("[Student Dashboard] No authenticated email found.");
        setMessage("No student profile found for this account yet.");
        return;
      }

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, school_id, group_id, onboarding_completed")
        .ilike("email", normalizedEmail)
        .eq("role", "student")
        .limit(1);

      if (profileError) {
        console.error("[Student Dashboard] profiles query error:", profileError);
        throw profileError;
      }

      const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === normalizedEmail) ?? null;
      console.log("[Student Dashboard] Student profile found:", Boolean(profile), profile ? { id: profile.id, email: profile.email } : null);

      if (!profile) {
        setMessage("No student profile found for this account yet.");
        return;
      }

      if (profile.onboarding_completed === false) {
        router.replace("/student/onboarding");
        return;
      }

      const { data: studentProfile, error: studentProfileError } = await supabase
        .from("student_profiles")
        .select("phone_number, internship_placement_id, accommodation_id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (studentProfileError) {
        console.error("[Student Dashboard] student_profiles query error:", studentProfileError);
      }

      if (!studentProfile) {
        console.log("[Student Dashboard] profiles row found, but student_profiles row was not found or could not be read:", profile.email);
      }

      const syncedProfileGroupName = await loadOptionalColumn(supabase, "profiles", profile.id, "group_name");
      const syncedStudentGroupName = await loadOptionalColumnByField(supabase, "student_profiles", "user_id", profile.id, "group_name");
      const profilePhotoUrl = await loadOptionalColumnByField(supabase, "student_profiles", "user_id", profile.id, "profile_photo_url");
      let emergencyPublicToken = await loadOptionalColumnByField(supabase, "student_profiles", "user_id", profile.id, "emergency_public_token");
      const emergencyCardEnabledValue = await loadOptionalColumnByField(supabase, "student_profiles", "user_id", profile.id, "emergency_card_enabled");

      if (!emergencyPublicToken && studentProfile) {
        const generatedToken = createEmergencyToken();
        const { error: tokenError } = await supabase
          .from("student_profiles")
          .update({
            emergency_public_token: generatedToken,
            emergency_card_enabled: true
          })
          .eq("user_id", profile.id);

        if (tokenError) {
          console.error("[Student Dashboard] emergency token update error:", tokenError);
        } else {
          emergencyPublicToken = generatedToken;
        }
      }

      const { data: group, error: groupError } = profile.group_id
        ? await supabase.from("groups").select("id, name, school_id").eq("id", profile.group_id).maybeSingle()
        : { data: null, error: null };
      if (groupError) {
        console.error("[Student Dashboard] groups query error:", groupError);
      }

      const { data: profileSchool, error: profileSchoolError } = profile.school_id
        ? await supabase.from("schools").select("id, name").eq("id", profile.school_id).maybeSingle()
        : { data: null, error: null };
      if (profileSchoolError) {
        console.error("[Student Dashboard] profile school query error:", profileSchoolError);
      }

      const resolvedGroupName =
        syncedStudentGroupName?.trim() ||
        syncedProfileGroupName?.trim() ||
        group?.name?.trim() ||
        profileSchool?.name?.trim() ||
        "";
      const resolvedGroup = resolvedGroupName
        ? { id: group?.id ?? profile.group_id ?? profile.school_id ?? "synced-group-name", name: resolvedGroupName }
        : null;

      const internship = studentProfile?.internship_placement_id
        ? await loadRecordWithOptionalMapUrl(supabase, "internship_placements", studentProfile.internship_placement_id, "id, name, address, working_hours")
        : null;

      const accommodationResult = studentProfile?.accommodation_id
        ? await loadRecordWithDebug(supabase, "accommodations", studentProfile.accommodation_id, "id, name, address, emergency_phone, hospital_medical_center_id")
        : { record: null, errorMessage: null };
      const accommodation = accommodationResult.record;

      const hospitalId =
        accommodation?.hospital_medical_center_id ??
        (accommodation?.id ? await loadOptionalColumn(supabase, "accommodations", accommodation.id, "hospital_medical_center_id") : null);
      const hospitalResult = hospitalId
        ? await loadRecordWithDebug(supabase, "hospital_medical_centers", hospitalId, "id, name, address")
        : { record: null, errorMessage: null };
      const hospital = hospitalResult.record;

      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("id, title, date, time, location, description, image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (activitiesError) {
        console.error("[Student Dashboard] activities query error:", activitiesError);
      }

      const normalizedStudentGroup = normalizeScheduleGroup(resolvedGroupName);
      const { data: loadedScheduleItems, error: scheduleError } = await supabase
        .from("schedule_items")
        .select("id, group_name, title, date, time, notes")
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (scheduleError) {
        console.error("[Student Dashboard] schedule query error:", scheduleError);
      }
      const matchingScheduleItems = (loadedScheduleItems ?? []).filter(
        (item) => normalizeScheduleGroup(item.group_name) === normalizedStudentGroup
      );

      setData({
        user: {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email
        },
        profile: {
          phoneNumber: studentProfile?.phone_number,
          profilePhotoUrl,
          emergencyPublicToken,
          emergencyCardEnabled: emergencyCardEnabledValue !== false && emergencyCardEnabledValue !== "false"
        },
        group: resolvedGroup,
        internship: internship
          ? {
              name: internship.name,
              address: internship.address,
              mapsUrl: internship.maps_url ?? internship.google_maps_url,
              workingHours: internship.working_hours
            }
          : null,
        accommodation: accommodation
          ? {
              name: accommodation.name,
              address: accommodation.address,
              emergencyPhone: accommodation.emergency_phone,
              mapsUrl: accommodation.maps_url ?? accommodation.google_maps_url
            }
          : null,
        hospital: hospital
          ? {
              name: hospital.name,
              address: hospital.address,
              mapsUrl: hospital.maps_url ?? hospital.google_maps_url
            }
          : null,
        scheduleItems:
          matchingScheduleItems.map((item) => ({
            id: item.id,
            title: item.title,
            date: item.date,
            time: item.time,
            notes: item.notes
          })),
        activities:
          activities?.map((activity) => ({
            id: activity.id,
            title: activity.title,
            date: activity.date,
            time: activity.time,
            location: activity.location,
            description: activity.description,
            imageUrl: activity.image_url
          })) ?? [],
      });
      setPhoneInput(studentProfile?.phone_number ?? "");
    } catch (error) {
      console.error("[Student Dashboard] Could not load student profile", error);
      setMessage(error instanceof Error ? error.message : "Could not load student profile.");
    } finally {
      setIsLoading(false);
    }
  }

  async function savePhoneNumber() {
    if (!data) {
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setPhoneMessage("Supabase is not configured yet.");
      return;
    }

    setIsSavingPhone(true);
    setPhoneMessage("");

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase
        .from("student_profiles")
        .update({
          phone_number: phoneInput.trim() || null
        })
        .eq("user_id", data.user.id);

      if (error) {
        throw error;
      }

      setData({
        ...data,
        profile: {
          ...data.profile,
          phoneNumber: phoneInput.trim() || null
        }
      });
      setIsEditingPhone(false);
      setIsProfileExpanded(false);
      setPhoneMessage("Phone number saved.");
    } catch (error) {
      console.error("[Student Dashboard] Could not save phone number", error);
      setPhoneMessage(error instanceof Error ? error.message : "Could not save phone number.");
    } finally {
      setIsSavingPhone(false);
    }
  }

  async function uploadProfilePhoto(file: File) {
    if (!data) {
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setPhotoMessage("Supabase is not configured yet.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoMessage("Please choose an image file.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage("");

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const filePath = `${data.user.id}/profile-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("student-profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("student-profile-photos").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("student_profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("user_id", data.user.id);

      if (updateError) {
        throw updateError;
      }

      setData({
        ...data,
        profile: {
          ...data.profile,
          profilePhotoUrl: publicUrl
        }
      });
      setPhotoMessage("Profile photo saved.");
    } catch (error) {
      console.error("[Student Dashboard] Could not upload profile photo", error);
      setPhotoMessage(error instanceof Error ? error.message : "Could not upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function startEditingPhone() {
    setPhoneInput(data?.profile.phoneNumber ?? "");
    setPhoneMessage("");
    setPhotoMessage("");
    setIsProfileExpanded(true);
    setIsEditingPhone(true);
  }

  function cancelEditingPhone() {
    setPhoneInput(data?.profile.phoneNumber ?? "");
    setPhoneMessage("");
    setPhotoMessage("");
    setIsEditingPhone(false);
    setIsProfileExpanded(false);
  }

  function openEmergencyCard() {
    setIsEmergencyCardOpen(true);
    window.setTimeout(() => {
      document.getElementById("emergency")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  if (isLoading) {
    return (
      <DashboardShell
        title="StudentHub"
        subtitle="Loading your student dashboard."
        roleLabel="Student dashboard"
        navItems={studentNav}
        mobileNavItems={studentMobileNav}
      >
        <LoadingDashboardSkeleton />
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell
        title="StudentHub"
        subtitle="Your student profile will appear here after it is synced from Google Sheets."
        roleLabel="Student dashboard"
        navItems={studentNav}
        mobileNavItems={studentMobileNav}
      >
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-era-navy">{message || "No student profile found for this account yet."}</p>
        </section>
      </DashboardShell>
    );
  }

  const { user, profile, group, internship, accommodation, hospital, scheduleItems, activities } = data;
  const appUrl = (typeof window !== "undefined" ? window.location.origin : appConfig.appUrl).replace(/\/$/, "");
  const emergencyCardUrl = profile.emergencyPublicToken ? `${appUrl}/emergency/${profile.emergencyPublicToken}` : "";
  const qrCodeUrl = emergencyCardUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(emergencyCardUrl)}`
    : "";

  return (
    <DashboardShell
      title={`Welcome, ${user.fullName}`}
      subtitle=""
      roleLabel="Student dashboard"
      navItems={studentNav}
      mobileNavItems={studentMobileNav}
      headerAction={
        <>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 sm:w-auto"
            type="button"
            onClick={openEmergencyCard}
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Emergency QR Card
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <InfoCard title="Profile / My Information" icon={UserRound} accent="teal">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {profile.profilePhotoUrl ? (
                <img
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover shadow-soft"
                  src={profile.profilePhotoUrl}
                  alt={`${user.fullName} profile photo`}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-era-sky text-era-navy shadow-soft">
                  <UserRound className="h-9 w-9" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="break-words text-lg font-black text-era-navy">{user.fullName}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white" type="button" onClick={startEditingPhone}>
                Edit
              </button>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-era-blue px-4 py-2 text-sm font-bold text-era-blue hover:bg-era-paper" href="/student/onboarding?review=1">
                View onboarding again
              </Link>
            </div>
          </div>

          {isProfileExpanded ? (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile.profilePhotoUrl ? (
              <img
                className="h-20 w-20 rounded-full border border-slate-200 object-cover shadow-soft"
                src={profile.profilePhotoUrl}
                alt={`${user.fullName} profile photo`}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-era-sky text-era-navy shadow-soft">
                <UserRound className="h-9 w-9" aria-hidden="true" />
              </div>
            )}
            <div>
              <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy sm:w-auto">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {isUploadingPhoto ? <LoadingButtonContent label="Uploading..." /> : "Upload photo"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingPhoto}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadProfilePhoto(file);
                    }
                    event.target.value = "";
                  }}
                />
              </label>
              {photoMessage ? <p className="mt-2 text-sm font-semibold text-era-navy">{photoMessage}</p> : null}
            </div>
          </div>
              <dl className="grid gap-3 text-sm">
                <div><dt className="font-bold text-era-navy">Group</dt><dd>{group?.name ?? "Not assigned yet"}</dd></div>
                <div><dt className="font-bold text-era-navy">Email</dt><dd>{user.email}</dd></div>
              </dl>
              <div className="mt-3 grid gap-2">
                <label className="grid gap-1 text-sm font-bold text-era-navy">
                  Phone
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 font-normal"
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                />
                </label>
                <div className="grid gap-2 sm:flex sm:flex-wrap">
                <>
                  <button className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-70" type="button" onClick={savePhoneNumber} disabled={isSavingPhone}>
                    {isSavingPhone ? <LoadingButtonContent label="Saving..." /> : "Save"}
                  </button>
                  <button className="min-h-11 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy" type="button" onClick={cancelEditingPhone} disabled={isSavingPhone}>
                    Cancel
                  </button>
                </>
                </div>
                {phoneMessage ? <p className="text-sm font-semibold text-era-navy">{phoneMessage}</p> : null}
              </div>
            </div>
          ) : null}
        </InfoCard>

        <InfoCard id="internship" title="Internship Placement" icon={BriefcaseBusiness} accent="blue">
          <p className="font-bold text-era-navy">{internship?.name ?? "Not assigned yet"}</p>
          <p className="mt-2 text-sm text-slate-600">{internship?.address ?? "Address not available yet"}</p>
          <p className="mt-2 text-sm"><strong>Working hours:</strong> {internship?.workingHours ?? "Not provided"}</p>
          {internship?.mapsUrl ? (
            <a className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white sm:w-auto" href={internship.mapsUrl} target="_blank" rel="noreferrer">
              <MapPin className="h-4 w-4" /> Google Maps
            </a>
          ) : null}
        </InfoCard>

        <InfoCard id="accommodation" title="Accommodation" icon={BedDouble} accent="green">
          <p className="font-bold text-era-navy">{accommodation?.name ?? "Not assigned yet"}</p>
          <p className="mt-2 text-sm text-slate-600">{accommodation?.address ?? "Address not available yet"}</p>
          <p className="mt-2 text-sm"><strong>Emergency phone:</strong> {accommodation?.emergencyPhone ?? "Not provided"}</p>
          {accommodation?.mapsUrl ? (
            <a className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-green px-4 py-2 text-sm font-bold text-white sm:w-auto" href={accommodation.mapsUrl} target="_blank" rel="noreferrer">
              <MapPin className="h-4 w-4" /> Google Maps
            </a>
          ) : null}
        </InfoCard>

        <InfoCard id="medical" title="Assigned Hospital / Medical Help" icon={HeartPulse} accent="red">
          <p className="font-bold text-era-navy">{hospital?.name ?? "Not assigned yet"}</p>
          <p className="mt-2 text-sm text-slate-600">{hospital?.address ?? "Address not available yet"}</p>
          <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
            {hospital?.mapsUrl ? (
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white" href={hospital.mapsUrl} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" /> Google Maps
              </a>
            ) : null}
            <WhatsAppButton message={`Hi European Era, I need help with medical assistance. My name is ${user.fullName}.`} label="Contact European Era" />
          </div>
          <button
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-red-600 px-4 py-2 text-sm font-bold text-red-700 sm:w-auto"
            type="button"
            onClick={() => setIsMedicalGuideOpen((current) => !current)}
          >
            Feeling sick?
            {isMedicalGuideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isMedicalGuideOpen ? (
            <div className="mt-4">
              <p className="text-sm text-slate-700">
                If you are sick or need to see a doctor, don't worry - we've prepared a step-by-step guide to help you through the process and make sure you get the care you need.
              </p>
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">
                If you are absent due to illness or another reason, a medical certificate may be required. You must also notify us and your teacher of your absence.
              </p>
              <ol className="mt-4 grid gap-3">
                {medicalSteps.map((step, index) => (
                  <li key={step} className="rounded-md border border-slate-200 p-3 text-sm leading-6">
                    <strong>Step {index + 1}:</strong> {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </InfoCard>
      </div>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft transition hover:border-era-blue sm:p-5" href="/student/support">
          <div className="flex items-start gap-3">
            <SmilePlus className="h-6 w-6 shrink-0 text-era-blue" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black text-era-navy">Need some support?</h2>
              <p className="mt-2 text-sm text-slate-600">Calm guidance for common mobility situations.</p>
            </div>
          </div>
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft transition hover:border-era-blue sm:p-5" href="/student/schedule">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-6 w-6 shrink-0 text-era-blue" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black text-era-navy">View Schedule</h2>
              {scheduleItems[0] ? (
                <p className="mt-2 text-sm text-slate-600">Next: <strong>{scheduleItems[0].title}</strong> on {scheduleItems[0].date} at {scheduleItems[0].time}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No schedule items yet.</p>
              )}
            </div>
          </div>
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft transition hover:border-era-blue sm:p-5" href="/student/activities">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-6 w-6 shrink-0 text-era-teal" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black text-era-navy">View Activities</h2>
              <p className="mt-2 text-sm text-slate-600">{activities.length ? `${activities.length} upcoming activit${activities.length === 1 ? "y" : "ies"} available.` : "No activities found yet."}</p>
            </div>
          </div>
        </Link>
      </section>

      <section id="emergency" className="mt-5 rounded-lg border-2 border-red-600 bg-red-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Siren className="h-8 w-8 shrink-0 text-red-600" />
          <div>
            <h2 className="text-xl font-black text-red-700 sm:text-2xl">Emergency Area</h2>
            <p className="mt-2 text-sm text-red-900">If there is immediate danger, call local emergency services first. Then contact European Era and your teacher.</p>
            <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
              <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 font-black text-white" href={`tel:${appConfig.emergencyPhone}`}>
                <PhoneCall className="h-5 w-5" /> Call European Era
              </a>
              <WhatsAppButton message={`Emergency support needed. My name is ${user.fullName}.`} label="Emergency WhatsApp" />
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-era-navy px-4 py-3 font-black text-white"
                type="button"
                onClick={() => setIsEmergencyCardOpen((current) => !current)}
              >
                <QrCode className="h-5 w-5" aria-hidden="true" />
                Emergency QR Card
              </button>
            </div>
            {isEmergencyCardOpen ? (
              <div id="emergency-pass-card" className="mt-5 overflow-hidden rounded-lg border border-era-orange bg-white shadow-soft">
                <div className="border-b-4 border-era-orange bg-era-blue px-5 py-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide">European Era StudentHub</p>
                  <h3 className="mt-1 text-2xl font-black">Emergency QR Card</h3>
                </div>
                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_320px]">
                  <div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {profile.profilePhotoUrl ? (
                        <img
                          className="h-32 w-32 rounded-xl border border-slate-200 object-cover shadow-soft"
                          src={profile.profilePhotoUrl}
                          alt={`${user.fullName} profile photo`}
                        />
                      ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-slate-200 bg-era-sky text-era-navy shadow-soft">
                          <UserRound className="h-14 w-14" aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-era-teal">Emergency ID</p>
                        <h4 className="mt-1 break-words text-2xl font-black text-era-navy sm:text-3xl">{user.fullName}</h4>
                        <p className="mt-1 text-base font-semibold text-slate-600">{group?.name ?? "Group not assigned yet"}</p>
                      </div>
                    </div>
                    <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-md bg-era-paper p-3">
                        <dt className="font-bold text-era-navy">Accommodation</dt>
                        <dd className="mt-1">{accommodation?.name ?? "Not assigned yet"}</dd>
                      </div>
                      <div className="rounded-md bg-era-paper p-3">
                        <dt className="font-bold text-era-navy">Assigned hospital</dt>
                        <dd className="mt-1">{hospital?.name ?? "Not assigned yet"}</dd>
                      </div>
                      <div className="rounded-md bg-era-paper p-3 md:col-span-2">
                        <dt className="font-bold text-era-navy">Hospital address</dt>
                        <dd className="mt-1">{hospital?.address ?? "Address not available yet"}</dd>
                      </div>
                      <div className="rounded-md bg-red-50 p-3">
                        <dt className="font-bold text-era-navy">European Era emergency phone</dt>
                        <dd className="mt-1">
                          <a className="font-bold text-red-700" href={`tel:${appConfig.emergencyPhone}`}>{appConfig.emergencyPhone}</a>
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <a className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 text-sm font-black text-white" href={`tel:${appConfig.emergencyPhone}`}>
                        <PhoneCall className="h-5 w-5" aria-hidden="true" />
                        Call European Era
                      </a>
                      <WhatsAppButton className="py-3 font-black" message={`Emergency support needed. My name is ${user.fullName}.`} label="WhatsApp European Era" />
                      {hospital?.mapsUrl ? (
                        <a className="inline-flex items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-3 text-sm font-black text-white" href={hospital.mapsUrl} target="_blank" rel="noreferrer">
                          <MapPin className="h-5 w-5" aria-hidden="true" />
                          Open Hospital in Maps
                        </a>
                      ) : null}
                      <button
                        className="no-emergency-print inline-flex items-center justify-center gap-2 rounded-md border border-era-navy px-4 py-3 text-sm font-black text-era-navy sm:col-span-2 lg:col-span-3"
                        type="button"
                        onClick={saveEmergencyCard}
                      >
                        <Download className="h-5 w-5" aria-hidden="true" />
                        Save Emergency Card
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-era-paper p-5">
                    {qrCodeUrl ? (
                      <>
                        <img className="h-auto w-full max-w-64 rounded-md bg-white p-2 shadow-sm" src={qrCodeUrl} alt="Emergency QR code" />
                        <p className="mt-3 text-center text-xs font-semibold text-slate-600">Scan to open the public emergency page.</p>
                      </>
                    ) : (
                      <p className="text-center text-sm font-semibold text-red-700">Emergency QR token is not ready yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
