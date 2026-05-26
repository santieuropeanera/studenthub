import { Resend } from "resend";
import { appConfig } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type InvitationUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  group_name: string | null;
  invite_status: string | null;
  invite_sent_at: string | null;
  auth_user_id: string | null;
  last_invite_error: string | null;
};

type InviteResult = {
  id: string;
  email: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function listInvitationUsers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, group_name, invite_status, invite_sent_at, auth_user_id, last_invite_error")
    .in("role", ["student", "teacher"])
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Could not load invitation users: ${error.message}`);
  }

  return (data ?? []) as InvitationUser[];
}

export async function sendInvitesToNewUsers() {
  const users = await listInvitationUsers();
  const pendingUsers = users.filter((user) => !user.invite_sent_at && user.invite_status !== "invited");
  const results: InviteResult[] = [];

  for (const user of pendingUsers) {
    results.push(await sendStudentHubInvite(user));
  }

  return results;
}

export async function resendUserInvite(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, group_name, invite_status, invite_sent_at, auth_user_id, last_invite_error")
    .eq("id", profileId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not find user to invite.");
  }

  return sendStudentHubInvite(data as InvitationUser);
}

async function sendStudentHubInvite(user: InvitationUser): Promise<InviteResult> {
  const supabase = createSupabaseAdminClient();
  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return markInviteFailed(user.id, "", "User does not have an email address.");
  }

  if (user.role === "admin") {
    return { id: user.id, email, status: "skipped", error: "Admins are not invited from Google Sheets." };
  }

  if (!resend) {
    return markInviteFailed(user.id, email, "RESEND_API_KEY is not configured.");
  }

  try {
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appConfig.appUrl}/auth/set-password`
      }
    });

    const actionLink = linkData?.properties?.action_link;

    if (linkError || !actionLink) {
      throw new Error(linkError?.message ?? "Supabase did not return an invitation link.");
    }

    const { error: emailError } = await resend.emails.send({
      from: appConfig.emailFrom,
      to: email,
      subject: "Welcome to StudentHub",
      html: renderInvitationEmail({
        fullName: user.full_name ?? "there",
        email,
        actionLink
      }),
      text: renderInvitationText({
        fullName: user.full_name ?? "there",
        email,
        actionLink
      })
    });

    if (emailError) {
      throw new Error(emailError.message);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        invite_status: "invited",
        invite_sent_at: new Date().toISOString(),
        auth_user_id: linkData.user?.id ?? user.auth_user_id ?? user.id,
        last_invite_error: null
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Invite was sent, but status could not be saved: ${updateError.message}`);
    }

    return { id: user.id, email, status: "sent" };
  } catch (error) {
    return markInviteFailed(user.id, email, error instanceof Error ? error.message : "Unknown invitation error.");
  }
}

async function markInviteFailed(id: string, email: string, error: string): Promise<InviteResult> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("profiles")
    .update({
      invite_status: "error",
      last_invite_error: error
    })
    .eq("id", id);

  return { id, email, status: "failed", error };
}

function renderInvitationEmail({ fullName, email, actionLink }: { fullName: string; email: string; actionLink: string }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #172033; line-height: 1.6;">
      <h1 style="color: #32409c;">Welcome to StudentHub</h1>
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>You have been invited to access StudentHub by European Era.</p>
      <p>StudentHub gives you access to your mobility information, including your schedule, accommodation details, internship/work placement information, activities, and emergency support.</p>
      <p><strong>Your login email is:</strong><br>${escapeHtml(email)}</p>
      <p>Please click the button below to create your password and access StudentHub.</p>
      <p>
        <a href="${actionLink}" style="display: inline-block; background: #32409c; color: white; padding: 12px 16px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Create password and access StudentHub
        </a>
      </p>
      <p>If you have any issues accessing your account, please contact the European Era team.</p>
      <p>European Era</p>
    </div>
  `;
}

function renderInvitationText({ fullName, email, actionLink }: { fullName: string; email: string; actionLink: string }) {
  return `Hello ${fullName},

You have been invited to access StudentHub by European Era.

StudentHub gives you access to your mobility information, including your schedule, accommodation details, internship/work placement information, activities, and emergency support.

Your login email is:
${email}

Please open this secure link to create your password and access StudentHub:
${actionLink}

If you have any issues accessing your account, please contact the European Era team.

European Era`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
