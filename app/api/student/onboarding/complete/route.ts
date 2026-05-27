import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "Please sign in before completing onboarding." }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json({ ok: false, error: userError?.message ?? "Your session could not be verified." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = user.email.trim().toLowerCase();
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, email")
    .ilike("email", normalizedEmail)
    .limit(1);

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  const profile = profileRows?.find((item) => item.email?.trim().toLowerCase() === normalizedEmail);

  if (!profile || profile.role !== "student") {
    return NextResponse.json({ ok: false, error: "Only students can complete student onboarding." }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
