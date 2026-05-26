import { NextResponse } from "next/server";
import { syncGoogleSheetsData } from "@/lib/services/google-sheets-sync";

export async function POST() {
  try {
    console.log("[Google Sheets Sync API] Run Sync requested");
    const result = await syncGoogleSheetsData();
    console.log("[Google Sheets Sync API] Run Sync completed", result);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[Google Sheets Sync API] Run Sync failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown sync error" },
      { status: 500 }
    );
  }
}
