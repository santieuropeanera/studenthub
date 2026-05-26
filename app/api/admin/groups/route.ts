import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const groupNames = new Set<string>();

    const { data: groups, error: groupsError } = await supabase.from("groups").select("name").order("name", { ascending: true });
    if (groupsError) throw groupsError;
    groups?.forEach((group) => {
      if (group.name?.trim()) groupNames.add(group.name.trim());
    });

    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("group_name").not("group_name", "is", null);
    if (profilesError) throw profilesError;
    profiles?.forEach((profile) => {
      if (profile.group_name?.trim()) groupNames.add(profile.group_name.trim());
    });

    const { data: studentProfiles, error: studentProfilesError } = await supabase.from("student_profiles").select("group_name").not("group_name", "is", null);
    if (studentProfilesError) throw studentProfilesError;
    studentProfiles?.forEach((profile) => {
      if (profile.group_name?.trim()) groupNames.add(profile.group_name.trim());
    });

    return NextResponse.json({ ok: true, groups: Array.from(groupNames).sort((a, b) => a.localeCompare(b)) });
  } catch (error) {
    console.error("[Admin Groups API] Could not load groups", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not load groups." }, { status: 500 });
  }
}
