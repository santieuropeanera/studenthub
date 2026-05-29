import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LifecycleAction = "deactivate" | "reactivate" | "delete";

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const body = (await request.json()) as { action?: LifecycleAction; userId?: string; confirmation?: string };

    if (!body.userId || !body.action) {
      return NextResponse.json({ ok: false, error: "Missing user lifecycle action." }, { status: 400 });
    }

    if (body.action === "delete" && body.confirmation !== "DELETE") {
      return NextResponse.json({ ok: false, error: "Type DELETE to permanently delete this user." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, email, full_name, auth_user_id")
      .eq("id", body.userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: profileError?.message ?? "User was not found." }, { status: 404 });
    }

    if (profile.role === "admin") {
      return NextResponse.json({ ok: false, error: "Admin users cannot be managed from this lifecycle action." }, { status: 403 });
    }

    if (body.action === "deactivate") {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_reason: "Manually deactivated by admin"
        })
        .eq("id", profile.id);

      if (error) throw error;
      return NextResponse.json({ ok: true, message: "User deactivated." });
    }

    if (body.action === "reactivate") {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: true,
          deactivated_at: null,
          deactivated_reason: null
        })
        .eq("id", profile.id);

      if (error) throw error;
      return NextResponse.json({ ok: true, message: "User reactivated." });
    }

    const blocker = await findDeleteBlocker(supabase, profile.id);
    if (blocker) {
      return NextResponse.json(
        { ok: false, error: `This user has historical records (${blocker}). Deactivate instead.` },
        { status: 409 }
      );
    }

    await supabase.from("student_profiles").delete().eq("user_id", profile.id);
    await supabase.from("teacher_profiles").delete().eq("user_id", profile.id);

    const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("id", profile.id);
    if (profileDeleteError) throw profileDeleteError;

    const authUserId = profile.auth_user_id ?? profile.id;
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId);
    if (authDeleteError) {
      return NextResponse.json({
        ok: true,
        message: `Profile deleted, but Supabase Auth user could not be deleted: ${authDeleteError.message}`
      });
    }

    return NextResponse.json({ ok: true, message: "User permanently deleted." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not update user lifecycle." },
      { status: 500 }
    );
  }
}

async function findDeleteBlocker(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const checks = [
    { table: "reports", column: "author_id", label: "reports authored by this user" },
    { table: "reports", column: "related_student_id", label: "reports linked to this user" },
    { table: "whatsapp_booking_logs", column: "student_id", label: "booking history" },
    { table: "schedule_items", column: "created_by", label: "schedule history" },
    { table: "activities", column: "created_by", label: "activity history" },
    { table: "announcements", column: "created_by", label: "announcements" },
    { table: "notifications", column: "created_by", label: "notifications" },
    { table: "shared_posts", column: "author_id", label: "shared posts" },
    { table: "shared_post_comments", column: "author_id", label: "shared post comments" }
  ];

  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select("id", { count: "exact", head: true })
      .eq(check.column, userId);

    if (!error && count && count > 0) {
      return check.label;
    }
  }

  return null;
}

async function requireAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "Please sign in as an admin." }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Your admin session could not be verified." }, { status: 401 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can manage users." }, { status: 403 });
  }

  return null;
}
