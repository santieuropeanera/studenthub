import { createHash } from "crypto";
import { google } from "googleapis";
import { z } from "zod";
import { buildMapsSearchUrl } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const catalogTabs = ["work placements", "accommodation", "hospitals", "schedule"] as const;

const optionalText = z.union([z.string().min(1), z.literal("").transform(() => undefined)]).optional();

export const workPlacementCatalogRowSchema = z.object({
  external_key: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  working_hours: optionalText
});

export const accommodationCatalogRowSchema = z.object({
  external_key: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  emergency_phone: optionalText,
  hospital_external_key: z.string().min(1)
});

export const hospitalCatalogRowSchema = z.object({
  external_key: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1)
});

export const scheduleRowSchema = z.object({
  group_name: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: optionalText
});

export const sheetRowSchema = z.object({
  role: z.enum(["student", "teacher"]),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: optionalText,
  school_name: z.string().min(1),
  group_name: z.string().min(1),
  work_placement_name: optionalText,
  working_hours: optionalText,
  accommodation_name: optionalText
});

export type SheetRow = z.infer<typeof sheetRowSchema>;
export type WorkPlacementCatalogRow = z.infer<typeof workPlacementCatalogRowSchema>;
export type AccommodationCatalogRow = z.infer<typeof accommodationCatalogRowSchema>;
export type HospitalCatalogRow = z.infer<typeof hospitalCatalogRowSchema>;
export type ScheduleRow = z.infer<typeof scheduleRowSchema>;

async function readSheetRows<T>(range: string, schema: z.ZodType<T>) {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Missing Google Sheets environment variables.");
  }

  console.log(`[Google Sheets Sync] Reading range: ${range}`);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = response.data.values ?? [];
  const [headers, ...rows] = values;

  if (!headers?.length) {
    console.log(`[Google Sheets Sync] No headers found for ${range}`);
    return [];
  }

  return rows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row, rowIndex) => {
      const record = Object.fromEntries(
        headers.map((header, index) => [normalizeHeader(String(header)), String(row[index] ?? "").trim()])
      );
      const parsed = schema.safeParse(record);

      if (!parsed.success) {
        throw new Error(`Invalid data in ${range}, row ${rowIndex + 2}: ${parsed.error.message}`);
      }

      return parsed.data;
    });
}

export async function readStudentHubSheet(range = "students!A1:Z") {
  return readSheetRows(range, sheetRowSchema);
}

export async function readCatalogTab<T>(tabName: string, schema: z.ZodType<T>) {
  return readSheetRows(`'${tabName}'!A1:Z`, schema);
}

export async function syncGoogleSheetsData() {
  const supabase = createSupabaseAdminClient();
  console.log("[Google Sheets Sync] Starting sync");

  const { data: syncLog, error: syncLogError } = await supabase
    .from("google_sheets_sync_logs")
    .insert({ status: "running", imported_rows: 0 })
    .select("id")
    .single();

  if (syncLogError) {
    console.warn("[Google Sheets Sync] Could not create sync log", syncLogError.message);
  }

  try {
    const [studentsAndTeachers, workPlacements, accommodation, hospitals, schedule] = await Promise.all([
      readStudentHubSheet(),
      readCatalogTab("work placements", workPlacementCatalogRowSchema),
      readCatalogTab("accommodation", accommodationCatalogRowSchema),
      readCatalogTab("hospitals", hospitalCatalogRowSchema),
      readCatalogTab("schedule", scheduleRowSchema)
    ]);

    console.log(
      `[Google Sheets Sync] Read ${studentsAndTeachers.length} people, ${workPlacements.length} work placements, ${accommodation.length} accommodation rows, ${hospitals.length} hospitals, ${schedule.length} schedule rows`
    );

    const hospitalIds = await upsertHospitals(supabase, hospitals);
    const accommodationByName = await upsertAccommodation(supabase, accommodation, hospitalIds);
    const workPlacementByName = await upsertWorkPlacements(supabase, workPlacements);
    const peopleResult = await upsertPeople(supabase, studentsAndTeachers, workPlacementByName, accommodationByName);
    const scheduleResult = await upsertScheduleItems(supabase, schedule);

    const importedCatalogRows = workPlacements.length + accommodation.length + hospitals.length;

    if (syncLog?.id) {
      await supabase
        .from("google_sheets_sync_logs")
        .update({
          status: peopleResult.errors.length ? "completed_with_errors" : "completed",
          imported_rows: studentsAndTeachers.length,
          finished_at: new Date().toISOString(),
          error: peopleResult.errors.length ? peopleResult.errors.join("\n") : null
        })
        .eq("id", syncLog.id);
    }

    console.log("[Google Sheets Sync] Sync finished", {
      importedRows: studentsAndTeachers.length,
      importedCatalogRows,
      skippedRows: peopleResult.errors.length
    });

    return {
      importedRows: studentsAndTeachers.length,
      importedCatalogRows,
      scheduleRowsImported: scheduleResult.created + scheduleResult.updated,
      scheduleCreated: scheduleResult.created,
      scheduleUpdated: scheduleResult.updated,
      scheduleDeactivated: scheduleResult.deactivated,
      studentsImported: peopleResult.imported,
      usersCreated: peopleResult.created,
      usersUpdated: peopleResult.updated,
      usersDeactivated: peopleResult.deactivated,
      usersReactivated: peopleResult.reactivated,
      skippedRows: peopleResult.errors,
      catalogTabs
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google Sheets sync error";
    console.error("[Google Sheets Sync] Sync failed", message);

    if (syncLog?.id) {
      await supabase
        .from("google_sheets_sync_logs")
        .update({ status: "failed", finished_at: new Date().toISOString(), error: message })
        .eq("id", syncLog.id);
    }

    throw error;
  }
}

async function upsertScheduleItems(supabase: ReturnType<typeof createSupabaseAdminClient>, rows: ScheduleRow[]) {
  console.log(`[Google Sheets Sync] Mirroring ${rows.length} schedule rows`);

  let created = 0;
  let updated = 0;
  let deactivated = 0;
  const currentKeys = new Set<string>();

  for (const row of rows) {
    const externalKey = buildScheduleExternalKey(row);
    currentKeys.add(externalKey);

    const payload = {
      external_key: externalKey,
      group_name: row.group_name,
      title: row.title,
      date: row.date,
      time: row.time,
      notes: row.notes ?? null,
      is_active: true
    };

    const { data: existing, error: findError } = await supabase
      .from("schedule_items")
      .select("id")
      .eq("external_key", externalKey)
      .maybeSingle();

    if (findError) {
      throw new Error(`Could not check schedule item "${row.title}": ${findError.message}`);
    }

    const result = existing?.id
      ? await supabase.from("schedule_items").update(payload).eq("id", existing.id)
      : await supabase.from("schedule_items").insert(payload);

    if (result.error) {
      throw new Error(`Could not upsert schedule item "${row.title}": ${result.error.message}`);
    }

    if (existing?.id) updated += 1;
    else created += 1;
  }

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("schedule_items")
    .select("id, external_key, is_active")
    .eq("is_active", true);

  if (existingRowsError) {
    throw new Error(`Could not read schedule rows for mirror cleanup: ${existingRowsError.message}`);
  }

  const missingIds = (existingRows ?? [])
    .filter((item) => !item.external_key || !currentKeys.has(String(item.external_key)))
    .map((item) => item.id as string);

  if (missingIds.length) {
    const { error } = await supabase
      .from("schedule_items")
      .update({ is_active: false })
      .in("id", missingIds);

    if (error) {
      throw new Error(`Could not deactivate removed schedule rows: ${error.message}`);
    }

    deactivated = missingIds.length;
  }

  console.log("[Google Sheets Sync] Schedule mirror finished", { created, updated, deactivated });

  return { created, updated, deactivated };
}

function buildScheduleExternalKey(row: ScheduleRow) {
  const normalized = [row.group_name, row.title, row.date, row.time]
    .map((value) =>
      value
        .normalize("NFKC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
    )
    .join("|");

  return `schedule_${createHash("sha256").update(normalized).digest("hex")}`;
}

async function upsertHospitals(supabase: ReturnType<typeof createSupabaseAdminClient>, rows: HospitalCatalogRow[]) {
  console.log(`[Google Sheets Sync] Upserting ${rows.length} hospitals`);

  const payload = rows.map((row) => ({
    external_key: row.external_key,
    name: row.name,
    address: row.address,
    maps_url: buildMapsSearchUrl(row.address),
    source_tab: "hospitals"
  }));

  if (payload.length) {
    const { error } = await supabase.from("hospital_medical_centers").upsert(payload, { onConflict: "external_key" });
    if (error) throw new Error(`Could not upsert hospitals: ${error.message}`);
  }

  const { data, error } = await supabase.from("hospital_medical_centers").select("id, external_key");
  if (error) throw new Error(`Could not read hospitals: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.external_key as string, row.id as string]));
}

async function upsertAccommodation(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  rows: AccommodationCatalogRow[],
  hospitalIds: Map<string, string>
) {
  console.log(`[Google Sheets Sync] Upserting ${rows.length} accommodation rows`);

  const payload = rows.map((row) => {
    const hospitalId = hospitalIds.get(row.hospital_external_key);
    if (!hospitalId) {
      throw new Error(`Accommodation "${row.name}" references missing hospital_external_key "${row.hospital_external_key}".`);
    }

    return {
      external_key: row.external_key,
      name: row.name,
      address: row.address,
      emergency_phone: row.emergency_phone ?? null,
      maps_url: buildMapsSearchUrl(row.address),
      hospital_medical_center_id: hospitalId,
      source_tab: "accommodation"
    };
  });

  if (payload.length) {
    const { error } = await supabase.from("accommodations").upsert(payload, { onConflict: "external_key" });
    if (error) throw new Error(`Could not upsert accommodation: ${error.message}`);
  }

  const { data, error } = await supabase.from("accommodations").select("id, name");
  if (error) throw new Error(`Could not read accommodation: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.name as string, row.id as string]));
}

async function upsertWorkPlacements(supabase: ReturnType<typeof createSupabaseAdminClient>, rows: WorkPlacementCatalogRow[]) {
  console.log(`[Google Sheets Sync] Upserting ${rows.length} work placements`);

  const payload = rows.map((row) => ({
    external_key: row.external_key,
    name: row.name,
    address: row.address,
    maps_url: buildMapsSearchUrl(row.address),
    working_hours: row.working_hours ?? null,
    source_tab: "work placements"
  }));

  if (payload.length) {
    const { error } = await supabase.from("internship_placements").upsert(payload, { onConflict: "external_key" });
    if (error) throw new Error(`Could not upsert work placements: ${error.message}`);
  }

  const { data, error } = await supabase.from("internship_placements").select("id, name");
  if (error) throw new Error(`Could not read work placements: ${error.message}`);

  return new Map((data ?? []).map((row) => [row.name as string, row.id as string]));
}

async function upsertPeople(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  rows: SheetRow[],
  workPlacementByName: Map<string, string>,
  accommodationByName: Map<string, string>
) {
  console.log(`[Google Sheets Sync] Upserting ${rows.length} people`);

  const errors: string[] = [];
  let imported = 0;
  let created = 0;
  let updated = 0;
  let deactivated = 0;
  let reactivated = 0;
  const sheetEmails = new Set(rows.map((row) => row.email.trim().toLowerCase()));

  for (const row of rows) {
    try {
      const schoolId = await findOrCreateSchool(supabase, row.school_name);
      const groupId = await findOrCreateGroup(supabase, schoolId, row.group_name);
      const existingProfile = await findProfileByEmail(supabase, row.email);
      const userId = await findOrCreateAuthUser(supabase, row.email, row.full_name);

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          role: row.role,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone ?? null,
          auth_user_id: userId,
          is_active: true,
          deactivated_at: null,
          deactivated_reason: null,
          school_id: schoolId,
          group_id: groupId,
          group_name: row.group_name
        },
        { onConflict: "email" }
      );

      if (profileError) throw new Error(profileError.message);

      if (row.role === "student") {
        if (!row.work_placement_name || !row.accommodation_name) {
          throw new Error(`Student "${row.full_name}" is missing work_placement_name or accommodation_name.`);
        }

        const internshipPlacementId = workPlacementByName.get(row.work_placement_name);
        const accommodationId = accommodationByName.get(row.accommodation_name);

        if (!internshipPlacementId) {
          throw new Error(`Student "${row.full_name}" has work_placement_name "${row.work_placement_name}", but it does not exactly match any name in the work placements catalog.`);
        }

        if (!accommodationId) {
          throw new Error(`Student "${row.full_name}" has accommodation_name "${row.accommodation_name}", but it does not exactly match any name in the accommodation catalog.`);
        }

        const { error: studentError } = await supabase.from("student_profiles").upsert(
          {
            user_id: userId,
            group_name: row.group_name,
            internship_placement_id: internshipPlacementId,
            accommodation_id: accommodationId
          },
          { onConflict: "user_id" }
        );

        if (studentError) throw new Error(studentError.message);
      }

      if (row.role === "teacher") {
        const { error: teacherError } = await supabase.from("teacher_profiles").upsert(
          { user_id: userId, school_id: schoolId, group_id: groupId, group_name: row.group_name },
          { onConflict: "user_id" }
        );

        if (teacherError) throw new Error(teacherError.message);
      }

      imported += 1;
      if (!existingProfile) created += 1;
      else if (existingProfile.is_active === false) reactivated += 1;
      else updated += 1;
      console.log(`[Google Sheets Sync] Imported ${row.role}: ${row.email}`);
    } catch (error) {
      const message = `${row.email}: ${error instanceof Error ? error.message : "Unknown row error"}`;
      console.error("[Google Sheets Sync] Row failed", message);
      errors.push(message);
    }
  }

  const { data: activeSheetManagedUsers, error: activeUsersError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("role", ["student", "teacher"])
    .eq("is_active", true);

  if (activeUsersError) {
    throw new Error(`Could not read active users for lifecycle cleanup: ${activeUsersError.message}`);
  }

  const missingUserIds = (activeSheetManagedUsers ?? [])
    .filter((profile) => !sheetEmails.has(String(profile.email ?? "").trim().toLowerCase()))
    .map((profile) => profile.id as string);

  if (missingUserIds.length) {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_reason: "Removed from Google Sheets sync"
      })
      .in("id", missingUserIds);

    if (error) {
      throw new Error(`Could not deactivate users removed from Sheets: ${error.message}`);
    }

    deactivated = missingUserIds.length;
  }

  return { imported, created, updated, deactivated, reactivated, errors };
}

async function findProfileByEmail(supabase: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(`Could not read profile "${email}": ${error.message}`);
  return data as { id: string; is_active?: boolean | null } | null;
}

async function findOrCreateSchool(supabase: ReturnType<typeof createSupabaseAdminClient>, name: string) {
  const { data: existing, error: selectError } = await supabase.from("schools").select("id").eq("name", name).maybeSingle();
  if (selectError) throw new Error(`Could not read school "${name}": ${selectError.message}`);
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase.from("schools").insert({ name }).select("id").single();
  if (error) throw new Error(`Could not create school "${name}": ${error.message}`);
  return data.id as string;
}

async function findOrCreateGroup(supabase: ReturnType<typeof createSupabaseAdminClient>, schoolId: string, name: string) {
  const { data: existing, error: selectError } = await supabase
    .from("groups")
    .select("id")
    .eq("school_id", schoolId)
    .eq("name", name)
    .maybeSingle();

  if (selectError) throw new Error(`Could not read group "${name}": ${selectError.message}`);
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase.from("groups").insert({ school_id: schoolId, name }).select("id").single();
  if (error) throw new Error(`Could not create group "${name}": ${error.message}`);
  return data.id as string;
}

async function findOrCreateAuthUser(supabase: ReturnType<typeof createSupabaseAdminClient>, email: string, fullName: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profile?.id) return profile.id as string;

  const existingAuthUserId = await findAuthUserIdByEmail(supabase, email);
  if (existingAuthUserId) return existingAuthUserId;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error || !data.user?.id) {
    throw new Error(`Could not create auth user: ${error?.message ?? "No user returned"}`);
  }

  return data.user.id;
}

async function findAuthUserIdByEmail(supabase: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not list auth users: ${error.message}`);

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 1000) return null;

    page += 1;
  }

  return null;
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}
