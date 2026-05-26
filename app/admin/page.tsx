import Link from "next/link";
import { ActivityIcon, BellRing, DatabaseZap, FileText, Home, School2, UsersRound } from "lucide-react";
import { AdminReports } from "@/components/admin-reports";
import { AdminUsersSummary } from "@/components/admin-users-summary";
import { DashboardShell } from "@/components/dashboard-shell";
import { LogoutButton } from "@/components/logout-button";
import { LogoutTestButton } from "@/components/logout-test-button";
import { RunSyncButton } from "@/components/run-sync-button";
import { groups, users } from "@/lib/demo-data";

const adminNav = [
  { href: "#home", label: "Home", icon: Home },
  { href: "#users", label: "Users", icon: UsersRound },
  { href: "#groups", label: "Groups", icon: School2 },
  { href: "#sync", label: "Sheets Sync", icon: DatabaseZap },
  { href: "#activities", label: "Activities", icon: ActivityIcon },
  { href: "#reports", label: "Reports", icon: FileText }
];

const adminMobileNav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "#sync", label: "Sync", icon: DatabaseZap },
  { href: "#users", label: "Users", icon: UsersRound },
  { href: "/admin/activities", label: "Activities", icon: ActivityIcon },
  { href: "#reports", label: "Reports", icon: FileText },
  { href: "#notifications", label: "Notifications/Alerts", icon: BellRing }
];

export default function AdminPage() {
  return (
    <>
      <LogoutTestButton />
      <DashboardShell
        title="Admin Operations"
        subtitle="Manage users, groups, Google Sheets sync, activities, and internal reports."
        roleLabel="Admin dashboard"
        navItems={adminNav}
        mobileNavItems={adminMobileNav}
      >
      <div className="mb-4 flex justify-end">
        <LogoutButton />
      </div>
      <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Stat label="Users" value={users.length} />
        <Stat label="Groups" value={groups.length} />
      </section>

      <AdminUsersSummary users={users} groups={groups} />

      <section id="groups" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
        <h2 className="text-xl font-black text-era-navy sm:text-2xl">Groups</h2>
        <p className="mt-2 text-sm text-slate-600">
          StudentHub treats schools and groups as the same operational grouping for now. Group data is synced from Google Sheets.
        </p>
      </section>

      <section id="sync" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
        <h2 className="text-xl font-black text-era-navy sm:text-2xl">Google Sheets Sync</h2>
        <p className="mt-2 text-sm text-slate-600">
          The sync reads the `source` Google Sheet and imports students, teachers, work placements, accommodation,
          hospitals, and schedule items into StudentHub.
        </p>
        <div className="mt-4 rounded-md bg-era-paper p-4 text-sm">
          Schedule is managed through Google Sheets only. Run sync after editing the source spreadsheet.
        </div>
        <RunSyncButton />
      </section>

      <section id="activities" className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:mt-6 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-era-navy sm:text-2xl">Activities Management</h2>
            <p className="mt-2 text-sm text-slate-600">Create, edit, deactivate, and delete student activities from a dedicated page.</p>
          </div>
          <Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy sm:w-fit" href="/admin/activities">
            <ActivityIcon className="h-4 w-4" aria-hidden="true" />
            Manage Activities
          </Link>
        </div>
      </section>

      <AdminReports />
      </DashboardShell>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 border-t-era-orange bg-white p-4 shadow-soft sm:p-5">
      <p className="text-sm font-bold uppercase text-era-teal">{label}</p>
      <p className="mt-2 text-3xl font-black text-era-navy">{value}</p>
    </div>
  );
}
