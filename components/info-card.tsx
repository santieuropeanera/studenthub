import type { LucideIcon } from "lucide-react";

type InfoCardProps = {
  id?: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  accent?: "blue" | "teal" | "green" | "orange" | "red";
};

const accentClasses = {
  blue: "bg-era-blue text-white",
  teal: "bg-era-teal text-white",
  green: "bg-era-green text-white",
  orange: "bg-era-orange text-era-ink",
  red: "bg-red-600 text-white"
};

export function InfoCard({ id, title, icon: Icon, children, accent = "blue" }: InfoCardProps) {
  return (
    <section id={id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-bold text-era-navy sm:text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}
