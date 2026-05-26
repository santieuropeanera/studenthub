"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type ReportRow = {
  id: string;
  title: string;
  date: string;
  description: string | null;
  author_id: string | null;
  created_at: string;
};

type AuthorRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export function AdminReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorRow>>({});
  const [reportText, setReportText] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  async function loadReports() {
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("id, title, date, description, author_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    const rows = data ?? [];
    setReports(rows);

    const authorIds = Array.from(new Set(rows.map((report) => report.author_id).filter(Boolean))) as string[];

    if (authorIds.length) {
      const { data: authorRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", authorIds);

      setAuthors(
        (authorRows ?? []).reduce<Record<string, AuthorRow>>((lookup, author) => {
          lookup[author.id] = author;
          return lookup;
        }, {})
      );
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadReports();
  }, []);

  async function handleCreateReport() {
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    const text = reportText.trim();

    if (!text) {
      setMessage("Please write report text before saving.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      setMessage(authError?.message ?? "Please sign in as an admin to create reports.");
      setIsSaving(false);
      return;
    }

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .ilike("email", user.email.trim().toLowerCase())
      .limit(1);

    if (profileError) {
      setMessage(profileError.message);
      setIsSaving(false);
      return;
    }

    const adminProfile = profileRows?.find((profile) => profile.email?.trim().toLowerCase() === user.email?.trim().toLowerCase());

    if (!adminProfile || adminProfile.role !== "admin") {
      setMessage("Only admins can create reports.");
      setIsSaving(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("reports").insert({
      title: "Admin report",
      date: today,
      author_id: adminProfile.id,
      category: "Internal",
      description: text,
      status: "open"
    });

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setReportText("");
    setMessage("Report saved.");
    await loadReports();
    setIsSaving(false);
  }

  return (
    <section id="reports" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
      <h2 className="text-xl font-black text-era-navy sm:text-2xl">Reports</h2>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-bold text-era-navy">
          New report
          <textarea
            className="min-h-28 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-era-blue focus:ring-2 focus:ring-era-sky"
            placeholder="Write report text..."
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
          />
        </label>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
          type="button"
          disabled={isSaving}
          onClick={handleCreateReport}
        >
          {isSaving ? "Saving..." : "Save report"}
        </button>
        {message ? <p className="text-sm font-semibold text-era-navy">{message}</p> : null}
      </div>

      <div className="mt-6 grid gap-3">
        <h3 className="font-black text-era-navy">Report history</h3>
        {isLoading ? <p className="text-sm text-slate-600">Loading reports...</p> : null}
        {!isLoading && !reports.length ? <p className="text-sm text-slate-600">No reports yet.</p> : null}
        {reports.map((report) => {
          const author = report.author_id ? authors[report.author_id] : null;
          const createdAt = new Date(report.created_at);

          return (
            <article key={report.id} className="rounded-md bg-era-paper p-4">
              <p className="whitespace-pre-wrap text-sm text-era-ink">{report.description ?? "No report text."}</p>
              <p className="mt-3 text-xs font-semibold text-slate-600">
                Generated by {author?.full_name || author?.email || "Unknown admin"} · {createdAt.toLocaleDateString()} · {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
