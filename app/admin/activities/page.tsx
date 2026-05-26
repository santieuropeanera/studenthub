import Link from "next/link";
import { ActivityIcon, ArrowLeft, BellRing, DatabaseZap, FileText, Home, School2, UsersRound } from "lucide-react";
import { AdminActivitiesManagement } from "@/components/admin-activities-management";
import { DashboardShell } from "@/components/dashboard-shell";

const adminNav = [
  { href: "/admin", label: "Home", icon: Home },
  { href: "/admin#users", label: "Users", icon: UsersRound },
  { href: "/admin#groups", label: "Groups", icon: School2 },
  { href: "/admin#sync", label: "Sheets Sync", icon: DatabaseZap },
  { href: "/admin/activities", label: "Activities", icon: ActivityIcon },
  { href: "/admin#reports", label: "Reports", icon: FileText }
];

const adminMobileNav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin#sync", label: "Sync", icon: DatabaseZap },
  { href: "/admin#users", label: "Users", icon: UsersRound },
  { href: "/admin/activities", label: "Activities", icon: ActivityIcon },
  { href: "/admin#reports", label: "Reports", icon: FileText },
  { href: "/admin#notifications", label: "Notifications/Alerts", icon: BellRing }
];

export default function AdminActivitiesPage() {
  return (
    <DashboardShell
      title="Activities Management"
      subtitle="Create, edit, deactivate, and delete European Era activities."
      roleLabel="Admin dashboard"
      navItems={adminNav}
      mobileNavItems={adminMobileNav}
    >
      <Link className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy sm:w-auto" href="/admin">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to admin dashboard
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <AdminActivitiesManagement />
      </section>
    </DashboardShell>
  );
}
