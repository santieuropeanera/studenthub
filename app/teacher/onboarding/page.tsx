"use client";

import { ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CalendarDays, CheckCircle2, Search, ShieldCheck, UsersRound, UserRound } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    title: "Welcome",
    text: "StudentHub helps teachers follow their group during the mobility. You can quickly check key student information, schedule updates, and emergency contact details from one place."
  },
  {
    icon: UsersRound,
    title: "Your Group",
    text: "Teachers only see students assigned to their own group. This keeps the Teacher area focused, clear, and relevant to the mobility you are supporting."
  },
  {
    icon: Search,
    title: "Student List",
    text: "The student list is compact by default so you can scan larger groups easily. Use search to find a student, accommodation, or work placement, then open a row to see more details."
  },
  {
    icon: UserRound,
    title: "Student Details",
    text: "When you expand a student, you can see useful operational details such as accommodation, work placement, working hours, assigned hospital, and phone number if the student has provided one."
  },
  {
    icon: CalendarDays,
    title: "Schedule",
    text: "The Schedule section shows the activities and important moments for your group. It helps you follow the same group plan students see in their dashboard."
  },
  {
    icon: ShieldCheck,
    title: "Finish",
    text: "You are ready to use the Teacher area. You can reopen this onboarding from the Teacher Dashboard whenever you need a quick reminder."
  }
];

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  async function finishOnboarding() {
    if (!supabase) {
      setMessage("StudentHub is not connected to Supabase yet.");
      return;
    }

    setIsFinishing(true);
    setMessage("");

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/teacher/onboarding/complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not finish onboarding.");
      }

      router.push("/teacher");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not finish onboarding.");
      setIsFinishing(false);
    }
  }

  const step = steps[stepIndex];
  const progress = `${stepIndex + 1} / ${steps.length}`;

  return (
    <main className="min-h-screen bg-era-paper px-4 py-6 text-era-ink sm:py-8">
      <section className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <img className="h-12 w-auto max-w-[132px] object-contain" src="/images/Logo%20Web.png" alt="European Era logo" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-era-teal">European Era</p>
            <h1 className="text-xl font-black text-era-navy sm:text-2xl">Teacher Onboarding</h1>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-era-navy">
              <span>{step.title}</span>
              <span>{progress}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-era-paper">
              <div className="h-full rounded-full bg-era-blue" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <Step icon={step.icon} title={step.title}>
            <p>{step.text}</p>
          </Step>

          {message ? <p className="mt-4 rounded-md bg-era-paper p-3 text-sm font-semibold text-era-navy">{message}</p> : null}

          <div className="mt-6 grid gap-3 sm:flex sm:items-center sm:justify-between">
            <button
              className="min-h-11 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            >
              Back
            </button>
            {stepIndex < steps.length - 1 ? (
              <button
                className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy"
                type="button"
                onClick={() => setStepIndex((current) => Math.min(current + 1, steps.length - 1))}
              >
                Continue
              </button>
            ) : (
              <button
                className="min-h-11 rounded-md bg-era-blue px-4 py-2 text-sm font-bold text-white hover:bg-era-navy disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={isFinishing}
                onClick={finishOnboarding}
              >
                {isFinishing ? "Saving..." : "Go to Teacher Dashboard"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({ icon: Icon, title, children }: { icon: typeof CheckCircle2; title: string; children: ReactNode }) {
  return (
    <section className="min-h-[220px]">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-era-sky text-era-blue">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-black text-era-navy">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}
