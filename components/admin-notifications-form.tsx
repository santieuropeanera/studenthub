"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BellRing, Send } from "lucide-react";

type TargetType = "all" | "group";
type Priority = "normal" | "important" | "urgent";

function formatPublishError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const details = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      error_description?: string;
    };
    const parts = [
      details.message || details.error_description,
      details.details ? `Details: ${details.details}` : "",
      details.hint ? `Hint: ${details.hint}` : "",
      details.code ? `Code: ${details.code}` : ""
    ].filter(Boolean);

    if (parts.length) {
      return parts.join(" ");
    }
  }

  return "Could not publish notification. Check that the notifications SQL migration has been run and that you are signed in as an admin.";
}

export function AdminNotificationsForm() {
  const [groups, setGroups] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetGroupName, setTargetGroupName] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch("/api/admin/groups");
        const body = await response.json();

        if (!response.ok || !body.ok) {
          throw new Error(body.error ?? "Could not load groups.");
        }

        setGroups(body.groups ?? []);
        setTargetGroupName(body.groups?.[0] ?? "");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not load groups.");
      } finally {
        setIsLoadingGroups(false);
      }
    }

    void loadGroups();
  }, []);

  async function publishNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPublishing(true);
    setStatus("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase is not configured yet.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not signed in. Please sign in as an admin before publishing notifications.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (profile?.role !== "admin") {
        throw new Error(`Your account is not an admin account${profile?.email ? ` (${profile.email})` : ""}. Notifications can only be published by admins.`);
      }

      const { error } = await supabase
        .from("notifications")
        .insert({
          title,
          message,
          target_type: targetType,
          target_group_name: targetType === "group" ? targetGroupName : null,
          priority,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          is_active: true
        });

      if (error) {
        throw error;
      }

      setTitle("");
      setMessage("");
      setTargetType("all");
      setPriority("normal");
      setExpiresAt("");
      setStatus("Notification published.");
    } catch (error) {
      console.error("[Admin Notifications] Publish failed", error);
      setStatus(formatPublishError(error));
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <form className="mt-4 grid gap-4" onSubmit={publishNotification}>
      <div className="flex items-center gap-2 text-era-navy">
        <BellRing className="h-5 w-5 text-era-blue" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">Create an in-app alert for students and teachers.</p>
      </div>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Title
        <input className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Message
        <textarea className="min-h-28 rounded-md border border-slate-300 px-3 py-2 font-normal" value={message} onChange={(event) => setMessage(event.target.value)} required />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-era-navy">
          Target
          <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={targetType} onChange={(event) => setTargetType(event.target.value as TargetType)}>
            <option value="all">All groups</option>
            <option value="group">Specific group</option>
          </select>
        </label>
        {targetType === "group" ? (
          <label className="grid gap-2 text-sm font-bold text-era-navy">
            Group
            <select
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
              value={targetGroupName}
              onChange={(event) => setTargetGroupName(event.target.value)}
              disabled={isLoadingGroups || !groups.length}
              required
            >
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-bold text-era-navy">
          Priority
          <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-era-navy">
          Expiry date
          <input className="rounded-md border border-slate-300 px-3 py-2 font-normal" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </label>
      </div>
      <button className="inline-flex w-fit items-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-70" type="submit" disabled={isPublishing || (targetType === "group" && !targetGroupName)}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {isPublishing ? "Publishing..." : "Publish alert"}
      </button>
      {status ? <p className="text-sm font-semibold text-era-navy">{status}</p> : null}
    </form>
  );
}
