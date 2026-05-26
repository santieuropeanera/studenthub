# StudentHub for European Era

StudentHub is a beginner-friendly MVP web app for European Era, an Erasmus+ mobility company in Málaga, Spain. It supports students, teachers, and admins with secure role-based dashboards for internships, accommodation, medical help, schedules, activities, shared school updates, emergency support, reports, Google Sheets sync, and email notifications.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth and database
- Google Sheets API for importing mobility data
- Resend for email notifications
- Vercel for deployment

## What Is Included In This MVP

- Student, teacher, and admin dashboard pages
- Role-focused navigation
- Student profile, internship, accommodation, hospital, medical guide, schedule, activities, shared area, and emergency section
- Teacher student list filtered by group in the UI model
- Admin overview, users, groups, Google Sheets sync information, schedule, activities, reports, and settings
- Reusable WhatsApp button using `https://wa.me/[PHONE]?text=[MESSAGE]`
- Supabase schema with the main tables and starter Row Level Security policies
- Google Sheets sync service with required column validation
- Email notification service and template for schedules and activities
- Beginner deployment and setup notes

## Run Locally

1. Install Node.js 20 or newer.
2. Open this folder in a terminal.
3. Install packages:

```bash
npm install
```

4. Copy the environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

The app currently uses demo data so non-developers can understand the screens before connecting Supabase.

## Environment Variables

Create `.env.local` with these values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

EUROPEAN_ERA_WHATSAPP_NUMBER=34617916957
EUROPEAN_ERA_EMERGENCY_PHONE=34617916957

RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="European Era StudentHub <studenthub@yourdomain.com>"

GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-google-sheet-id
```

Use phone numbers in international format without `+` for WhatsApp.

## Supabase Setup

1. Create a new project at `https://supabase.com`.
2. Go to SQL Editor.
3. Open `supabase/schema.sql`.
4. Paste the SQL and run it.
5. Go to Authentication and enable email login.
6. Create users for students, teachers, and admins.
7. Add matching rows in the `profiles` table with the correct role: `student`, `teacher`, or `admin`.

If you already created the database before the catalog sync was added, run `supabase/catalog-sync-migration.sql` once in the Supabase SQL Editor before using Run Sync.

Security notes:

- Students should only read their own profile and their own group data.
- Teachers should only read students and shared posts from their group.
- Admins can read and manage all data.
- The SQL file includes starter RLS policies. Review them before production launch.

## Google Sheets Setup

Your real Google Drive structure is:

```text
Database / StudentHub / source
```

The Google Sheet named `source` should treat these tabs as master catalog tables:

```text
students
work placements
accommodation
hospitals
schedule
```

The sync reads these tabs from the configured Google Sheet.

`work placements` catalog columns:

```text
external_key
name
address
working_hours
```

`hospitals` catalog columns:

```text
external_key
name
address
```

`accommodation` catalog columns:

```text
external_key
name
address
emergency_phone
hospital_external_key
```

`students` tab columns:

```text
full_name
email
role
school_name
group_name
work_placement_name
working_hours
accommodation_name
```

`schedule` tab columns:

```text
group_name
title
date
time
notes
```

Students should not repeat placement addresses, accommodation addresses, accommodation emergency phones, or hospital addresses. The app gets those details from the catalogs. The sync matches `work_placement_name` exactly against the `name` column in `work placements`, and `accommodation_name` exactly against the `name` column in `accommodation`.

For the MVP, the sync also saves the raw `group_name` from the `students` tab onto `profiles`, `student_profiles`, and `teacher_profiles`. The dashboards use that direct group name for profile display and schedule matching.

How to connect Google Sheets API:

1. Create a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a Service Account.
4. Create a JSON key for that Service Account.
5. Share your Google Sheet with the Service Account email.
6. Add the Service Account email, private key, and spreadsheet ID to `.env.local`.

How to run a sync:

- Admin dashboard: click `Run Sync`.
- Local test endpoint: send a `POST` request to `/api/admin/sync-google-sheets`.
- The same sync imports people, catalogs, and the `schedule` tab.

Troubleshooting missing data:

- Check that the tab names are exactly `students`, `work placements`, `accommodation`, `hospitals`, and `schedule`.
- Check that column names match exactly.
- Check that `accommodation.hospital_external_key` matches a row in the `hospitals` tab.
- Check that each student `work_placement_name` and `accommodation_name` exactly matches a real catalog name.
- Check that each schedule `group_name` exactly matches the synced student or teacher group name.
- Check that every email is valid.
- Check that the Service Account email has access to the Google Sheet.
- Check that `GOOGLE_SHEETS_PRIVATE_KEY` keeps the `\n` line breaks.

## Email Notifications

StudentHub uses Resend in this MVP.

1. Create a Resend account.
2. Verify your sending domain.
3. Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.local`.
4. When an admin creates a schedule item or activity, call the notification service with the affected students and teachers.

The email includes:

- Subject
- Schedule or activity title
- Date and time
- Location
- Short description
- Link to open StudentHub

Notification attempts should be saved in `notification_logs` in production.

## Deploy On Vercel

1. Push the project to GitHub.
2. Create a new Vercel project.
3. Import the GitHub repository.
4. Add all environment variables in Vercel Project Settings.
5. Deploy.

After deployment, update:

```bash
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

## Test The Roles

Demo pages:

- Student: `/student`
- Teacher: `/teacher`
- Admin: `/admin`

Production testing:

1. Create one student user in Supabase Auth.
2. Create one teacher user in Supabase Auth.
3. Create one admin user in Supabase Auth.
4. Add profile rows with the right role and group.
5. Confirm the student only sees their own data.
6. Confirm the teacher only sees students from their group.
7. Confirm the admin can see everything.

## Common Errors

`Missing Supabase environment variables`

Check `.env.local` and restart the dev server.

`Missing Google Sheets environment variables`

Add all Google Sheets variables and restart the dev server.

`Invalid email in Google Sheets`

Fix the email address in the sheet.

`Email was skipped`

`RESEND_API_KEY` is missing. Add it to `.env.local`.

## Future Improvements

- Replace demo pages with full Supabase-authenticated route protection.
- Add real admin forms for creating schedules, activities, reports, announcements, and settings.
- Finish Google Sheets upsert logic once the final spreadsheet format is approved.
- Add file uploads for shared posts and report attachments using Supabase Storage.
- Add admin notification logs UI.
- Add automated tests for RLS, sync mapping, and notification failures.
- Add localized date formatting per school or group if needed, while keeping the interface in English.

Deployment trigger
