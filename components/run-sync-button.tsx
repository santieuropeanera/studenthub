"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { LoadingButtonContent } from "@/components/loading-states";

type SyncResult = {
  importedRows: number;
  importedCatalogRows: number;
  scheduleRowsImported?: number;
  studentsImported: number;
  skippedRows: string[];
};

export function RunSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function runSync() {
    setIsSyncing(true);
    setMessage("");
    setErrors([]);

    try {
      const response = await fetch("/api/admin/sync-google-sheets", { method: "POST" });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Google Sheets sync failed.");
      }

      const result = body.result as SyncResult;
      setMessage(
        `Sync complete: ${result.importedCatalogRows} catalog rows, ${result.studentsImported} people, ${result.scheduleRowsImported ?? 0} schedule items imported.`
      );
      setErrors(result.skippedRows ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google Sheets sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        className="inline-flex items-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
        type="button"
        onClick={runSync}
        disabled={isSyncing}
      >
        {isSyncing ? <LoadingButtonContent label="Running sync..." /> : (
          <>
            <RefreshCw className="h-4 w-4" />
            Run Sync
          </>
        )}
      </button>
      {message ? <p className="mt-3 text-sm font-semibold text-era-navy">{message}</p> : null}
      {errors.length ? (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
          <p className="font-bold">Rows needing attention:</p>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
