"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Pencil, Power, Save, Trash2, X } from "lucide-react";

type TargetType = "all" | "group";
type Priority = "normal" | "important" | "urgent";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  target_type: TargetType;
  target_group_name: string | null;
  priority: Priority;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
};

type NotificationEdit = {
  title: string;
  message: string;
  target_type: TargetType;
  target_group_name: string;
  priority: Priority;
  expires_at: string;
  is_active: boolean;
};

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const details = error as { message?: string; details?: string; hint?: string; code?: string };
    return [details.message, details.details ? `Details: ${details.details}` : "", details.hint ? `Hint: ${details.hint}` : "", details.code ? `Code: ${details.code}` : ""]
      .filter(Boolean)
      .join(" ");
  }

  return "Something went wrong.";
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function displayDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "No expiry";
}

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function AdminNotificationsManagement() {
  const [groups, setGroups] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<NotificationEdit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setStatus("");

    try {
      const [groupsResponse, notificationsResult] = await Promise.all([
        fetch("/api/admin/groups"),
        loadNotifications()
      ]);
      const groupsBody = await groupsResponse.json();

      if (!groupsResponse.ok || !groupsBody.ok) {
        throw new Error(groupsBody.error ?? "Could not load groups.");
      }

      setGroups(groupsBody.groups ?? []);
      setNotifications(notificationsResult);
    } catch (error) {
      setStatus(formatSupabaseError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadNotifications() {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, target_type, target_group_name, priority, created_at, expires_at, is_active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  }

  function startEditing(notification: NotificationRow) {
    setEditingId(notification.id);
    setEditValues({
      title: notification.title,
      message: notification.message,
      target_type: notification.target_type,
      target_group_name: notification.target_group_name ?? groups[0] ?? "",
      priority: notification.priority,
      expires_at: toDateInputValue(notification.expires_at),
      is_active: notification.is_active
    });
    setStatus("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValues(null);
    setStatus("");
  }

  async function saveEditing(id: string) {
    if (!editValues) return;

    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("notifications")
        .update({
          title: editValues.title,
          message: editValues.message,
          target_type: editValues.target_type,
          target_group_name: editValues.target_type === "group" ? editValues.target_group_name : null,
          priority: editValues.priority,
          expires_at: editValues.expires_at ? new Date(editValues.expires_at).toISOString() : null,
          is_active: editValues.is_active
        })
        .eq("id", id);

      if (error) throw error;

      setStatus("Notification updated.");
      setEditingId(null);
      setEditValues(null);
      setNotifications(await loadNotifications());
    } catch (error) {
      setStatus(formatSupabaseError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(notification: NotificationRow) {
    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_active: !notification.is_active })
        .eq("id", notification.id);

      if (error) throw error;

      setStatus(notification.is_active ? "Notification deactivated." : "Notification reactivated.");
      setNotifications(await loadNotifications());
    } catch (error) {
      setStatus(formatSupabaseError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteNotification(notification: NotificationRow) {
    if (!window.confirm(`Delete notification "${notification.title}"?`)) return;

    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("notifications").delete().eq("id", notification.id);

      if (error) throw error;

      setStatus("Notification deleted.");
      setNotifications(await loadNotifications());
    } catch (error) {
      setStatus(formatSupabaseError(error));
    } finally {
      setIsSaving(false);
    }
  }

  function updateEditValue<Key extends keyof NotificationEdit>(key: Key, value: NotificationEdit[Key]) {
    setEditValues((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Edit, deactivate, reschedule, or delete in-app notifications.</p>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-era-navy" type="button" onClick={loadData} disabled={isLoading || isSaving}>
          Refresh
        </button>
      </div>
      {status ? <p className="mb-3 text-sm font-semibold text-era-navy">{status}</p> : null}
      {isLoading ? (
        <p className="rounded-md bg-era-paper p-4 text-sm font-semibold text-era-navy">Loading notifications...</p>
      ) : notifications.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-era-sky text-era-navy">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Message</th>
                <th className="p-3">Target</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Created</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => {
                const isEditing = editingId === notification.id && editValues;

                return (
                  <tr key={notification.id} className="border-b border-slate-100 align-top">
                    <td className="p-3">
                      {isEditing ? (
                        <input className="w-full rounded-md border border-slate-300 px-2 py-1" value={editValues.title} onChange={(event) => updateEditValue("title", event.target.value)} />
                      ) : (
                        <span className="font-bold text-era-navy">{notification.title}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <textarea className="min-h-20 w-full rounded-md border border-slate-300 px-2 py-1" value={editValues.message} onChange={(event) => updateEditValue("message", event.target.value)} />
                      ) : (
                        <span className="line-clamp-3">{notification.message}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <div className="grid gap-2">
                          <select className="rounded-md border border-slate-300 px-2 py-1" value={editValues.target_type} onChange={(event) => updateEditValue("target_type", event.target.value as TargetType)}>
                            <option value="all">All groups</option>
                            <option value="group">Specific group</option>
                          </select>
                          {editValues.target_type === "group" ? (
                            <select className="rounded-md border border-slate-300 px-2 py-1" value={editValues.target_group_name} onChange={(event) => updateEditValue("target_group_name", event.target.value)}>
                              {groups.map((group) => (
                                <option key={group} value={group}>{group}</option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      ) : (
                        <span>{notification.target_type === "all" ? "All groups" : notification.target_group_name ?? "Group not set"}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <select className="rounded-md border border-slate-300 px-2 py-1" value={editValues.priority} onChange={(event) => updateEditValue("priority", event.target.value as Priority)}>
                          <option value="normal">Normal</option>
                          <option value="important">Important</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      ) : (
                        <span className="capitalize">{notification.priority}</span>
                      )}
                    </td>
                    <td className="p-3">{displayDate(notification.created_at)}</td>
                    <td className="p-3">
                      {isEditing ? (
                        <input className="rounded-md border border-slate-300 px-2 py-1" type="date" value={editValues.expires_at} onChange={(event) => updateEditValue("expires_at", event.target.value)} />
                      ) : (
                        displayDate(notification.expires_at)
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editValues.is_active} onChange={(event) => updateEditValue("is_active", event.target.checked)} />
                          Active
                        </label>
                      ) : (
                        <span className={`rounded-md px-2 py-1 text-xs font-bold ${notification.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                          {notification.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <button className="inline-flex items-center gap-1 rounded-md bg-era-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-70" type="button" onClick={() => saveEditing(notification.id)} disabled={isSaving}>
                            <Save className="h-3.5 w-3.5" aria-hidden="true" />
                            Save
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy" type="button" onClick={cancelEditing} disabled={isSaving}>
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy" type="button" onClick={() => startEditing(notification)} disabled={isSaving}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy" type="button" onClick={() => toggleActive(notification)} disabled={isSaving}>
                            <Power className="h-3.5 w-3.5" aria-hidden="true" />
                            {notification.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white" type="button" onClick={() => deleteNotification(notification)} disabled={isSaving}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-md bg-era-paper p-4 text-sm text-slate-600">No notifications have been created yet.</p>
      )}
    </div>
  );
}
