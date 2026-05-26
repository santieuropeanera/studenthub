import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/studenthub";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, school_id, group_id, group_name")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return profile;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(`/${profile.role}`);
  }

  return profile;
}

export async function requireRoleOrDemo(allowedRoles: UserRole[]) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return requireRole(allowedRoles);
}
