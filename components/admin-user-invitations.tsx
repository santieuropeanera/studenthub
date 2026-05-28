"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, MailPlus, RefreshCw, Send } from "lucide-react";
import { LoadingButtonContent } from "@/components/loading-states";

type InvitationUser = {
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

export function AdminUserInvitations() {
  const [users, setUsers] = useState<InvitationUser[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  const pendingUsers = users.filter((user) => !user.invite_sent_at && user.invite_status !== "invited");
  const invitedUsers = users.filter((user) => user.invite_sent_at || user.invite_status === "invited");
  const failedUsers = users.filter((user) => user.invite_status === "error" || user.last_invite_error);

  async function authHeaders() {
    if (!supabase) throw new Error("Supabase is not configured yet.");
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) throw new Error("Please sign in as an admin.");

    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function loadInvitations() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/invitations", {
        headers: await authHeaders()
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not load user invitations.");
      }

      setUsers(body.users ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load user invitations.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInvitations();
  }, []);

  async function sendNewInvites() {
    setIsSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders())
        },
        body: JSON.stringify({ action: "send_new" })
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not send invitations.");
      }

      setMessage(formatResults(body.results ?? []));
      await loadInvitations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send invitations.");
    } finally {
      setIsSending(false);
    }
  }

  async function resendInvite(profileId: string) {
    setResendingId(profileId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders())
        },
        body: JSON.stringify({ action: "resend", profileId })
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not resend invitation.");
      }

      setMessage(formatResults(body.results ?? []));
      await loadInvitations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend invitation.");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <section id="invitations" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-era-navy sm:text-2xl">
            <MailPlus className="h-5 w-5 text-era-blue" aria-hidden="true" />
            User Invitations
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Send secure password setup links to newly synced students and teachers. Admins are never invited from Google Sheets.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy sm:w-fit"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          {isOpen ? "Collapse invitations" : "Manage invitations"}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <InviteStat label="Pending" value={pendingUsers.length} />
        <InviteStat label="Sent" value={invitedUsers.length} />
        <InviteStat label="Failed" value={failedUsers.length} />
      </div>

      {isOpen ? (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Invite newly synced students and teachers, or resend a setup link manually.</p>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
              type="button"
              onClick={sendNewInvites}
              disabled={isSending || isLoading || pendingUsers.length === 0}
            >
              {isSending ? <LoadingButtonContent label="Sending..." /> : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send invites to new users
                </>
              )}
            </button>
          </div>

          {message ? <p className="mt-3 rounded-md bg-era-paper p-3 text-sm font-semibold text-era-navy">{message}</p> : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <InvitationList
              title={`Pending users (${pendingUsers.length})`}
              emptyText={isLoading ? "Loading pending users..." : "No pending users."}
              users={pendingUsers}
              actionLabel="Send invite"
              resendingId={resendingId}
              onResend={resendInvite}
            />
            <InvitationList
              title={`Already invited (${invitedUsers.length})`}
              emptyText={isLoading ? "Loading invited users..." : "No users have been invited yet."}
              users={invitedUsers}
              actionLabel="Resend invite"
              resendingId={resendingId}
              onResend={resendInvite}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function InviteStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-era-paper px-3 py-2">
      <p className="text-xs font-bold uppercase text-era-teal">{label}</p>
      <p className="mt-1 text-lg font-black text-era-navy">{value}</p>
    </div>
  );
}

function InvitationList({
  title,
  emptyText,
  users,
  actionLabel,
  resendingId,
  onResend
}: {
  title: string;
  emptyText: string;
  users: InvitationUser[];
  actionLabel: string;
  resendingId: string | null;
  onResend: (profileId: string) => void;
}) {
  return (
    <div className="rounded-md border border-slate-200">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-black text-era-navy">{title}</h3>
      </div>
      <div className="divide-y divide-slate-200">
        {users.length ? (
          users.map((user) => (
            <div key={user.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-bold text-era-navy">{user.full_name || "Unnamed user"}</p>
                <p className="text-sm text-slate-600">{user.email || "No email"}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {user.role || "user"} {user.group_name ? `- ${user.group_name}` : ""}
                </p>
                {user.invite_sent_at ? (
                  <p className="mt-1 text-xs text-slate-500">Invited {new Date(user.invite_sent_at).toLocaleString()}</p>
                ) : null}
                {user.last_invite_error ? <p className="mt-1 text-xs font-semibold text-red-700">{user.last_invite_error}</p> : null}
              </div>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-era-blue px-3 py-2 text-sm font-bold text-era-blue hover:bg-era-paper disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
                type="button"
                onClick={() => onResend(user.id)}
                disabled={resendingId === user.id || !user.email}
              >
                {resendingId === user.id ? <LoadingButtonContent label="Sending..." /> : (
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {actionLabel}
                  </>
                )}
              </button>
            </div>
          ))
        ) : (
          <p className="px-4 py-5 text-sm text-slate-600">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function formatResults(results: InviteResult[]) {
  if (!results.length) return "No new users needed an invitation.";

  const sent = results.filter((result) => result.status === "sent").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;

  return `Invitations complete: ${sent} sent, ${failed} failed, ${skipped} skipped.`;
}
