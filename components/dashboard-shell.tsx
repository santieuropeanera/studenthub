import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard";
import { LogoutButton } from "@/components/logout-button";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type DashboardShellProps = {
  title: string;
  subtitle: string;
  roleLabel: string;
  navItems: NavItem[];
  mobileNavItems?: NavItem[];
  headerAction?: ReactNode;
  mobileMenuAction?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ title, subtitle, roleLabel, navItems, mobileNavItems, headerAction, mobileMenuAction, children }: DashboardShellProps) {
  const menuItems = mobileNavItems ?? navItems;

  return (
    <div className="min-h-screen">
      <DashboardAuthGuard />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <img
                className="h-12 w-auto max-w-[132px] shrink-0 object-contain sm:h-14 sm:max-w-[150px]"
                src="/images/Logo%20Web.png"
                alt="European Era logo"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-era-teal sm:text-sm">European Era</p>
                <h1 className="text-xl font-black text-era-navy sm:text-2xl">StudentHub</h1>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="w-fit rounded-md border border-era-orange bg-era-sky px-3 py-2 text-sm font-bold text-era-navy">{roleLabel}</span>
              {headerAction}
              <LogoutButton />
            </div>
          </div>
          <details className="group relative sm:hidden">
            <summary className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between rounded-md border border-era-orange bg-era-sky px-4 py-2 text-sm font-black text-era-navy [&::-webkit-details-marker]:hidden">
              Menu
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <nav className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft" aria-label="Mobile dashboard navigation">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm font-bold text-era-navy last:border-b-0 hover:bg-era-sky"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-era-blue" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
              {mobileMenuAction ? <div className="border-t border-slate-100">{mobileMenuAction}</div> : null}
              <div className="border-t border-slate-100">
                <LogoutButton variant="mobile" />
              </div>
            </nav>
          </details>
          <nav className="hidden gap-2 overflow-x-auto pb-1 sm:flex" aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-era-navy hover:border-era-orange hover:text-era-blue"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-5 sm:mb-6">
          <h2 className="break-words text-2xl font-black text-era-navy sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-base text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
