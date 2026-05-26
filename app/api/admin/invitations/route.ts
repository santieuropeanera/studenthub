import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listInvitationUsers, resendUserInvite, sendInvitesToNewUsers } from "@/lib/services/user-invitations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const users = await listInvitationUsers();
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load user invitations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const body = (await request.json()) as { action?: string; profileId?: string };

    if (body.action === "send_new") {
      const results = await sendInvitesToNewUsers();
      return NextResponse.json({ ok: true, results });
    }

    if (body.action === "resend" && body.profileId) {
      const result = await resendUserInvite(body.profileId);
      return NextResponse.json({ ok: true, results: [result] });
    }

    return NextResponse.json({ ok: false, error: "Unknown invitation action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not send invitations." },
      { status: 500 }
    );
  }
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
  const { data: profileById, error: profileByIdError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileByIdError) {
    return NextResponse.json({ ok: false, error: profileByIdError.message }, { status: 500 });
  }

  let role = profileById?.role;

  if (!role && user.email) {
    const { data: profileByEmail, error: profileByEmailError } = await adminClient
      .from("profiles")
      .select("role")
      .ilike("email", user.email.trim().toLowerCase())
      .maybeSingle();

    if (profileByEmailError) {
      return NextResponse.json({ ok: false, error: profileByEmailError.message }, { status: 500 });
    }

    role = profileByEmail?.role;
  }

  if (role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can manage user invitations." }, { status: 403 });
  }

  return null;
}
