"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Pencil, Power, Save, Trash2, X } from "lucide-react";

type ActivityRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  minimum_participants: number | null;
  age_requirement: string | null;
  image_url: string | null;
  whatsapp_booking_url: string | null;
  is_active: boolean;
};

type ActivityEdit = {
  title: string;
  description: string;
  category: string;
  minimum_participants: string;
  age_requirement: string;
  image_url: string;
  whatsapp_booking_url: string;
  is_active: boolean;
};

const categories = ["Culture", "Social", "Food", "Experience", "Sports", "Other"];

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured yet.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const details = error as { message?: string; details?: string; hint?: string; code?: string };
    return [details.message, details.details ? `Details: ${details.details}` : "", details.hint ? `Hint: ${details.hint}` : "", details.code ? `Code: ${details.code}` : ""].filter(Boolean).join(" ");
  }
  return "Something went wrong.";
}

function toEdit(row?: ActivityRow): ActivityEdit {
  return {
    title: row?.title ?? "",
    description: row?.description ?? "",
    category: row?.category ?? "Culture",
    minimum_participants: row?.minimum_participants?.toString() ?? "",
    age_requirement: row?.age_requirement ?? "",
    image_url: row?.image_url ?? "",
    whatsapp_booking_url: row?.whatsapp_booking_url ?? "",
    is_active: row?.is_active ?? true
  };
}

function parseMinimumParticipants(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const minimum = Number(trimmed);
  return Number.isFinite(minimum) ? minimum : null;
}

function formatMinimumParticipants(value: number | null) {
  if (!value || value <= 0) {
    return "No minimum participants required";
  }

  return `${value} ${value === 1 ? "person" : "people"}`;
}

export function AdminActivitiesManagement() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [newActivity, setNewActivity] = useState<ActivityEdit>(toEdit());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ActivityEdit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void refreshActivities();
  }, []);

  async function loadActivities() {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("activities")
      .select("id, title, description, category, minimum_participants, age_requirement, image_url, whatsapp_booking_url, is_active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ActivityRow[];
  }

  async function refreshActivities() {
    setIsLoading(true);
    setStatus("");

    try {
      setActivities(await loadActivities());
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsLoading(false);
    }
  }

  function payloadFrom(values: ActivityEdit) {
    return {
      title: values.title,
      description: values.description || null,
      category: values.category,
      minimum_participants: parseMinimumParticipants(values.minimum_participants),
      age_requirement: values.age_requirement || null,
      image_url: values.image_url || null,
      whatsapp_booking_url: values.whatsapp_booking_url || null,
      is_active: values.is_active
    };
  }

  async function createActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("activities").insert(payloadFrom(newActivity));
      if (error) throw error;

      setNewActivity(toEdit());
      setStatus("Activity created.");
      setActivities(await loadActivities());
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveActivity(id: string) {
    if (!editValues) return;
    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("activities").update(payloadFrom(editValues)).eq("id", id);
      if (error) throw error;

      setEditingId(null);
      setEditValues(null);
      setStatus("Activity updated.");
      setActivities(await loadActivities());
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActivity(row: ActivityRow) {
    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("activities").update({ is_active: !row.is_active }).eq("id", row.id);
      if (error) throw error;

      setStatus(row.is_active ? "Activity deactivated." : "Activity reactivated.");
      setActivities(await loadActivities());
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteActivity(row: ActivityRow) {
    if (!window.confirm(`Delete activity "${row.title}"?`)) return;
    setIsSaving(true);
    setStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("activities").delete().eq("id", row.id);
      if (error) throw error;

      setStatus("Activity deleted.");
      setActivities(await loadActivities());
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setIsSaving(false);
    }
  }

  function updateNew<Key extends keyof ActivityEdit>(key: Key, value: ActivityEdit[Key]) {
    setNewActivity((current) => ({ ...current, [key]: value }));
  }

  function updateEdit<Key extends keyof ActivityEdit>(key: Key, value: ActivityEdit[Key]) {
    setEditValues((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="mt-4 grid gap-5 sm:gap-6">
      <form className="grid gap-4 rounded-md bg-era-paper p-4" onSubmit={createActivity}>
        <h3 className="font-black text-era-navy">Create activity</h3>
        <ActivityFields values={newActivity} onChange={updateNew} />
        <button className="min-h-11 w-full rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-70 sm:w-fit" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Create activity"}
        </button>
      </form>

      {status ? <p className="text-sm font-semibold text-era-navy">{status}</p> : null}

      {isLoading ? (
        <p className="rounded-md bg-era-paper p-4 text-sm font-semibold text-era-navy">Loading activities...</p>
      ) : activities.length ? (
        <div className="grid gap-3">
          {activities.map((activity) => {
            const isEditing = editingId === activity.id && editValues;

            return (
              <article key={activity.id} className="rounded-md border border-slate-200 bg-white p-4">
                {isEditing ? (
                  <div className="grid gap-4">
                    <ActivityFields values={editValues} onChange={updateEdit} />
                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      <button className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md bg-era-blue px-3 py-2 text-xs font-bold text-white" type="button" onClick={() => saveActivity(activity.id)} disabled={isSaving}>
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                      <button className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy" type="button" onClick={() => { setEditingId(null); setEditValues(null); }} disabled={isSaving}>
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                    {activity.image_url ? (
                      <div className="h-36 rounded-md bg-cover bg-center md:h-28" style={{ backgroundImage: `url(${activity.image_url})` }} />
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-md bg-era-sky text-sm font-bold text-era-navy">No image</div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-era-navy">{activity.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                        </div>
                        <span className={`rounded-md px-2 py-1 text-xs font-bold ${activity.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                          {activity.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm"><strong>Category:</strong> {activity.category ?? "Not set"}</p>
                      <p className="text-sm"><strong>Minimum participants:</strong> {formatMinimumParticipants(activity.minimum_participants)}</p>
                      <p className="text-sm"><strong>Age requirement:</strong> {activity.age_requirement ?? "None"}</p>
                      <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                        <button className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy" type="button" onClick={() => { setEditingId(activity.id); setEditValues(toEdit(activity)); }} disabled={isSaving}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-era-navy" type="button" onClick={() => toggleActivity(activity)} disabled={isSaving}>
                          <Power className="h-3.5 w-3.5" /> {activity.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                        <button className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white" type="button" onClick={() => deleteActivity(activity)} disabled={isSaving}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md bg-era-paper p-4 text-sm text-slate-600">No activities have been created yet.</p>
      )}
    </div>
  );
}

function ActivityFields({ values, onChange }: { values: ActivityEdit; onChange: <Key extends keyof ActivityEdit>(key: Key, value: ActivityEdit[Key]) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Title
        <input className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal" value={values.title} onChange={(event) => onChange("title", event.target.value)} required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Category
        <select className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal" value={values.category} onChange={(event) => onChange("category", event.target.value)}>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy md:col-span-2">
        Description
        <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 font-normal" value={values.description} onChange={(event) => onChange("description", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Minimum participants
        <input className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal" min="0" type="number" value={values.minimum_participants} onChange={(event) => onChange("minimum_participants", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Age requirement
        <input className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal" value={values.age_requirement} onChange={(event) => onChange("age_requirement", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        Image URL
        <input className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal" value={values.image_url} onChange={(event) => onChange("image_url", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-era-navy">
        WhatsApp booking URL
        <input className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal" value={values.whatsapp_booking_url} onChange={(event) => onChange("whatsapp_booking_url", event.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold text-era-navy">
        <input type="checkbox" checked={values.is_active} onChange={(event) => onChange("is_active", event.target.checked)} />
        Active
      </label>
    </div>
  );
}
