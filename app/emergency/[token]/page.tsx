import { notFound } from "next/navigation";
import { HeartPulse, MapPin, MessageCircle, PhoneCall, UserRound } from "lucide-react";
import { appConfig, buildWhatsAppUrl } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type EmergencyPageProps = {
  params: {
    token: string;
  };
};

export default async function PublicEmergencyPage({ params }: EmergencyPageProps) {
  const token = params.token?.trim();

  if (!token) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data: studentProfile, error: studentError } = await supabase
    .from("student_profiles")
    .select("user_id, profile_photo_url, group_name, accommodation_id")
    .eq("emergency_public_token", token)
    .eq("emergency_card_enabled", true)
    .maybeSingle();

  if (studentError) {
    console.error("[Emergency Page] student profile query error:", studentError);
    notFound();
  }

  if (!studentProfile) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, group_name")
    .eq("id", studentProfile.user_id)
    .maybeSingle();

  const { data: accommodation } = studentProfile.accommodation_id
    ? await supabase
        .from("accommodations")
        .select("name, hospital_medical_center_id")
        .eq("id", studentProfile.accommodation_id)
        .maybeSingle()
    : { data: null };

  const { data: hospital } = accommodation?.hospital_medical_center_id
    ? await supabase
        .from("hospital_medical_centers")
        .select("name, address, maps_url")
        .eq("id", accommodation.hospital_medical_center_id)
        .maybeSingle()
    : { data: null };
  const { data: hospitalGoogleMaps } =
    accommodation?.hospital_medical_center_id && !hospital?.maps_url
      ? await supabase
          .from("hospital_medical_centers")
          .select("google_maps_url")
          .eq("id", accommodation.hospital_medical_center_id)
          .maybeSingle()
      : { data: null };

  const fullName = profile?.full_name ?? "Student";
  const groupName = studentProfile.group_name ?? profile?.group_name ?? "Group not available";
  const hospitalMapsUrl = hospital?.maps_url ?? hospitalGoogleMaps?.google_maps_url ?? null;
  const whatsappMessage = `Emergency support needed for ${fullName}. I opened their StudentHub emergency card.`;

  return (
    <main className="min-h-screen bg-red-50 px-3 py-3 sm:px-6 sm:py-4">
      <section className="mx-auto max-w-xl overflow-hidden rounded-lg border-2 border-era-orange bg-white shadow-soft">
        <div className="border-b-4 border-era-orange bg-era-blue px-4 py-4 text-white sm:px-5">
          <div className="flex items-center gap-3">
            <HeartPulse className="h-7 w-7 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">European Era StudentHub</p>
              <h1 className="text-2xl font-black">Emergency Pass</h1>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
        <div className="flex flex-col items-center gap-4 text-center">
          {studentProfile.profile_photo_url ? (
            <img
              className="h-36 w-36 rounded-xl border border-slate-200 object-cover shadow-soft"
              src={studentProfile.profile_photo_url}
              alt={`${fullName} profile photo`}
            />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-xl border border-slate-200 bg-era-sky text-era-navy shadow-soft">
              <UserRound className="h-16 w-16" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="break-words text-2xl font-black text-era-navy sm:text-3xl">{fullName}</h2>
            <p className="mt-1 text-base font-bold text-slate-600">{groupName}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="rounded-md bg-era-paper p-4">
            <dt className="font-bold text-era-navy">Accommodation</dt>
            <dd className="mt-1 text-slate-700">{accommodation?.name ?? "Not available"}</dd>
          </div>
          <div className="rounded-md bg-era-paper p-4">
            <dt className="font-bold text-era-navy">Assigned hospital / medical center</dt>
            <dd className="mt-1 text-slate-700">{hospital?.name ?? "Not available"}</dd>
            <dd className="mt-1 text-slate-700">{hospital?.address ?? "Address not available"}</dd>
          </div>
          <div className="rounded-md bg-red-50 p-4">
            <dt className="font-bold text-red-700">European Era emergency phone</dt>
            <dd className="mt-1">
              <a className="text-lg font-black text-red-700" href={`tel:${appConfig.emergencyPhone}`}>
                {appConfig.emergencyPhone}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-3">
          <a className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-4 font-black text-white" href={`tel:${appConfig.emergencyPhone}`}>
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
            Call European Era
          </a>
          <a
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#24d366] px-4 py-4 font-black text-white"
            href={buildWhatsAppUrl(appConfig.whatsappNumber, whatsappMessage)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            WhatsApp European Era
          </a>
          {hospitalMapsUrl ? (
            <a
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-4 font-black text-white"
              href={hospitalMapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin className="h-5 w-5" aria-hidden="true" />
              Open Hospital in Maps
            </a>
          ) : null}
        </div>
        </div>
      </section>
    </main>
  );
}
