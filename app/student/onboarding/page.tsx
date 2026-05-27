"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BedDouble, BriefcaseBusiness, Camera, CheckCircle2, HeartPulse, ImageIcon, QrCode, UserRound } from "lucide-react";
import { appConfig } from "@/lib/config";

type OnboardingData = {
  userId: string;
  fullName: string;
  email: string;
  groupName: string | null;
  profilePhotoUrl: string | null;
  accommodation: { name: string | null; hospitalId: string | null } | null;
  internship: { name: string | null } | null;
  hospital: { name: string | null; address: string | null } | null;
};

const steps = [
  "Welcome",
  "Profile photo",
  "Review information",
  "Emergency QR",
  "Activities",
  "Finish"
];

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  useEffect(() => {
    void loadOnboardingData();
  }, [supabase]);

  async function loadOnboardingData() {
    if (!supabase) {
      setMessage("StudentHub is not connected to Supabase yet.");
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        router.replace("/login");
        return;
      }

      const normalizedEmail = user.email.trim().toLowerCase();
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, group_id, school_id, group_name")
        .ilike("email", normalizedEmail)
        .eq("role", "student")
        .limit(1);

      if (profileError) throw profileError;

      const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === normalizedEmail);

      if (!profile) {
        setMessage("No student profile found for this account yet.");
        setIsLoading(false);
        return;
      }

      const { data: studentProfile, error: studentProfileError } = await supabase
        .from("student_profiles")
        .select("user_id, group_name, profile_photo_url, accommodation_id, internship_placement_id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (studentProfileError) throw studentProfileError;

      const groupName = studentProfile?.group_name?.trim() || profile.group_name?.trim() || null;

      const { data: accommodation } = studentProfile?.accommodation_id
        ? await supabase
            .from("accommodations")
            .select("name, hospital_medical_center_id")
            .eq("id", studentProfile.accommodation_id)
            .maybeSingle()
        : { data: null };

      const { data: internship } = studentProfile?.internship_placement_id
        ? await supabase
            .from("internship_placements")
            .select("name")
            .eq("id", studentProfile.internship_placement_id)
            .maybeSingle()
        : { data: null };

      const { data: hospital } = accommodation?.hospital_medical_center_id
        ? await supabase
            .from("hospital_medical_centers")
            .select("name, address")
            .eq("id", accommodation.hospital_medical_center_id)
            .maybeSingle()
        : { data: null };

      setData({
        userId: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        groupName,
        profilePhotoUrl: studentProfile?.profile_photo_url ?? null,
        accommodation: accommodation
          ? { name: accommodation.name, hospitalId: accommodation.hospital_medical_center_id }
          : null,
        internship: internship ? { name: internship.name } : null,
        hospital: hospital ? { name: hospital.name, address: hospital.address } : null
      });
    } catch (error) {
      console.error("[Student Onboarding] Could not load onboarding data", error);
      setMessage(error instanceof Error ? error.message : "Could not load onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !data || !supabase) return;

    setIsUploading(true);
    setMessage("");

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${data.userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("student-profile-photos").upload(filePath, file, {
        upsert: true
      });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl }
      } = supabase.storage.from("student-profile-photos").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("student_profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("user_id", data.userId);

      if (updateError) throw updateError;

      setData({ ...data, profilePhotoUrl: publicUrl });
      setMessage("Profile photo saved.");
    } catch (error) {
      console.error("[Student Onboarding] Could not upload photo", error);
      setMessage(error instanceof Error ? error.message : "Could not upload profile photo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function finishOnboarding() {
    if (!supabase) {
      setMessage("StudentHub is not connected to Supabase yet.");
      return;
    }

    setIsFinishing(true);
    setMessage("");

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/student/onboarding/complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not finish onboarding.");
      }

      router.push("/student");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not finish onboarding.");
      setIsFinishing(false);
    }
  }

  const progress = `${stepIndex + 1} / ${steps.length}`;

  return (
    <main className="min-h-screen bg-era-paper px-4 py-6 text-era-ink sm:py-8">
      <section className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <img className="h-12 w-auto max-w-[132px] object-contain" src="/images/Logo%20Web.png" alt="European Era logo" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-era-teal">European Era</p>
            <h1 className="text-xl font-black text-era-navy sm:text-2xl">StudentHub Onboarding</h1>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-era-navy">
              <span>{steps[stepIndex]}</span>
              <span>{progress}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-era-paper">
              <div className="h-full rounded-full bg-era-blue" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          {isLoading ? <p className="text-sm font-semibold text-era-navy">Loading onboarding...</p> : null}

          {!isLoading && data ? (
            <div>
              {stepIndex === 0 ? (
                <Step icon={CheckCircle2} title={`Welcome to StudentHub, ${data.fullName}`}>
                  <p>StudentHub is your European Era mobility portal. It helps you find your key mobility information, schedule, activities, medical help, and emergency support in one place.</p>
                </Step>
              ) : null}

              {stepIndex === 1 ? (
                <Step icon={Camera} title="Add your profile photo">
                  <p>Your photo is used for identification and emergency support during your mobility.</p>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    {data.profilePhotoUrl ? (
                      <img className="h-24 w-24 rounded-full border border-slate-200 object-cover shadow-soft" src={data.profilePhotoUrl} alt={`${data.fullName} profile photo`} />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-era-sky text-era-navy shadow-soft">
                        <UserRound className="h-10 w-10" aria-hidden="true" />
                      </div>
                    )}
                    <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy sm:w-auto">
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      {isUploading ? "Uploading..." : data.profilePhotoUrl ? "Change photo" : "Upload photo"}
                      <input className="sr-only" type="file" accept="image/*" disabled={isUploading} onChange={uploadProfilePhoto} />
                    </label>
                  </div>
                </Step>
              ) : null}

              {stepIndex === 2 ? (
                <Step icon={BriefcaseBusiness} title="Review your key information">
                  <div className="grid gap-3 text-sm">
                    <InfoRow icon={BedDouble} label="Accommodation" value={data.accommodation?.name ?? "Not assigned yet"} />
                    <InfoRow icon={BriefcaseBusiness} label="Work placement" value={data.internship?.name ?? "Not assigned yet"} />
                    <InfoRow icon={HeartPulse} label="Assigned hospital" value={data.hospital?.name ?? "Not assigned yet"} />
                    <InfoRow icon={UserRound} label="Group" value={data.groupName ?? "Not assigned yet"} />
                  </div>
                  <p className="mt-4 rounded-md bg-era-paper p-3 text-sm font-semibold text-era-navy">
                    Please review your information carefully and contact European Era if anything is incorrect.
                  </p>
                </Step>
              ) : null}

              {stepIndex === 3 ? (
                <Step icon={QrCode} title="Emergency QR Card">
                  <p>Your Emergency QR Card gives quick access to essential emergency information, including your accommodation, assigned hospital, and European Era emergency contacts. It can help during your mobility if you need support quickly.</p>
                </Step>
              ) : null}

              {stepIndex === 4 ? (
                <Step icon={ImageIcon} title="Activities & Experiences">
                  <p>You can browse European Era activities and experiences from StudentHub and reserve them through WhatsApp. Please reserve all activities at least 48 hours in advance.</p>
                </Step>
              ) : null}

              {stepIndex === 5 ? (
                <Step icon={CheckCircle2} title="You're ready">
                  <p>Your StudentHub setup is complete. You can now open your dashboard and use StudentHub during your mobility.</p>
                </Step>
              ) : null}
            </div>
          ) : null}

          {message ? <p className="mt-4 rounded-md bg-era-paper p-3 text-sm font-semibold text-era-navy">{message}</p> : null}

          <div className="mt-6 grid gap-3 sm:flex sm:items-center sm:justify-between">
            <button
              className="min-h-11 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={stepIndex === 0 || isLoading}
              onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            >
              Back
            </button>
            {stepIndex < steps.length - 1 ? (
              <button
                className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={isLoading || !data}
                onClick={() => setStepIndex((current) => Math.min(current + 1, steps.length - 1))}
              >
                Continue
              </button>
            ) : (
              <button
                className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={isFinishing || isLoading || !data}
                onClick={finishOnboarding}
              >
                {isFinishing ? "Saving..." : "Go to my dashboard"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">Need help? Contact European Era at {appConfig.whatsappNumber}.</p>
      </section>
    </main>
  );
}

function Step({ icon: Icon, title, children }: { icon: typeof CheckCircle2; title: string; children: ReactNode }) {
  return (
    <section className="min-h-[260px]">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-era-sky text-era-blue">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-black text-era-navy">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-slate-200 p-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-era-blue" aria-hidden="true" />
      <div>
        <p className="font-bold text-era-navy">{label}</p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}
