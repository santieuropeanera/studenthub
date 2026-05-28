"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BedDouble, BriefcaseBusiness, CalendarDays, HeartPulse, Home, ImageIcon, QrCode, Siren, SmilePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

const studentNav = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student#internship", label: "My Internship", icon: BriefcaseBusiness },
  { href: "/student#accommodation", label: "My Accommodation", icon: BedDouble },
  { href: "/student#medical", label: "Medical Help", icon: HeartPulse },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/activities", label: "Activities", icon: ImageIcon },
  { href: "/student/support", label: "Student Support", icon: SmilePlus },
  { href: "/student#emergency", label: "Emergency", icon: Siren }
];

const studentMobileNav = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/activities", label: "Activities", icon: ImageIcon },
  { href: "/student/support", label: "Student Support", icon: SmilePlus },
  { href: "/student#emergency", label: "Emergency QR Card", icon: QrCode },
  { href: "/student#medical", label: "Medical Help", icon: HeartPulse },
  { href: "/student#accommodation", label: "Accommodation", icon: BedDouble },
  { href: "/student#internship", label: "Internship", icon: BriefcaseBusiness }
];

const topics = [
  {
    icon: "🌱",
    title: "First Days at Your Internship",
    summary: "A calm reminder that the first days are usually an adaptation period.",
    text: `Feeling nervous during your first days is completely normal.

For most students, the first days are the hardest because everything is new. You are adapting to a new country, a new workplace, new people, and new routines — and that takes time.

Try not to put too much pressure on yourself. The first days are usually a period of adaptation not only for you, but also for the workplace. Give yourself time to settle in and understand how things work.

Sometimes arriving at a new placement may feel less exciting than expected. People can be busy, stressed, or focused on their daily work. This does not mean they are not interested in you or that you are not welcome. Real workplaces are often simply busy environments.

Do not expect to feel fully comfortable immediately — that is completely normal. Confidence and comfort usually come step by step.

A few things that can help:
- Be patient with yourself
- Ask questions when needed
- Stay open and curious
- Focus on learning little by little
- Remember that adaptation takes time

Most students feel much better after the first few days.

You are not alone in this experience.`
  },
  {
    icon: "🏡",
    title: "Feeling Homesick",
    summary: "Gentle support for being away from home and familiar routines.",
    text: `Feeling homesick during mobility is very common.

Being away from home, family, friends, and familiar routines can sometimes feel emotionally overwhelming, especially during the first weeks.

What you are feeling is normal, and many students experience the same thing.

It can help to:
- Stay connected with family and friends
- Spend time with your group or classmates
- Keep yourself active and busy
- Explore the city little by little
- Give yourself time to adapt

Try not to isolate yourself too much. Often, small daily routines and social moments help more than expected.

And remember: you do not have to manage everything alone.

If you need support, you can always contact European Era or speak with your teacher/coordinator. We are here to listen and help when needed.`
  },
  {
    icon: "🧭",
    title: "Feeling Overwhelmed",
    summary: "Small steps for when mobility feels like a lot at once.",
    text: `Sometimes mobility experiences can feel overwhelming.

There are many new things happening at the same time: a new city, a new language, new responsibilities, new people, and new routines. It is completely normal to feel mentally tired or emotionally overloaded from time to time.

You do not need to solve everything immediately.

Try to take things step by step instead of thinking about everything at once. Often, small routines and small victories help much more than putting too much pressure on yourself.

A few things that may help:
- Get enough rest and sleep
- Take short breaks during the day
- Go for a walk or spend some time outside
- Stay connected with people around you
- Focus on one thing at a time

Remember that adapting to a new environment takes energy, and some difficult days are part of the process.

If things start to feel too heavy, you can always reach out to European Era or your teacher/coordinator for support.`
  },
  {
    icon: "🤝",
    title: "Difficulty Making Friends",
    summary: "Reassurance that social comfort can take time.",
    text: `Meeting new people is not always easy, especially in a completely new environment.

Some students make connections quickly, while others need more time. Both situations are completely normal.

Do not feel pressured to become close friends with everyone immediately. Real friendships usually develop naturally little by little through shared experiences, conversations, activities, and daily life.

Sometimes the first days can feel lonely, but this often improves with time.

A few things that can help:
- Join activities even if you feel shy
- Spend time with classmates or roommates
- Start with small conversations
- Stay open to meeting different people
- Remember that many others may feel exactly the same way

You are not expected to feel perfectly comfortable socially from day one.

Give yourself time and be patient with the process.`
  },
  {
    icon: "🌍",
    title: "Culture Shock",
    summary: "Understanding the normal ups and downs of adapting abroad.",
    text: `Living in another country can sometimes feel strange or confusing.

You may notice different ways of communicating, different routines, different working styles, or different social habits. At times this can feel frustrating, surprising, or emotionally tiring.

This is a very normal part of international mobility and is often called “culture shock.”

It does not mean that something is wrong with you or that you made a bad decision. It simply means you are adapting to a different environment.

A few things that may help:
- Stay curious instead of judging too quickly
- Give yourself time to understand differences
- Ask questions when something feels unclear
- Keep an open mind
- Accept that adaptation takes time

Most students slowly become more comfortable as the weeks go by.

You do not need to understand everything immediately. Step by step, things usually start to feel more natural.`
  }
];

export default function StudentSupportPage() {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  return (
    <DashboardShell
      title="Student Support"
      subtitle="Friendly guidance for common mobility situations."
      roleLabel="Student dashboard"
      navItems={studentNav}
      mobileNavItems={studentMobileNav}
    >
      <Link className="mb-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-era-navy sm:w-auto" href="/student">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Dashboard
      </Link>

      <section className="grid gap-3">
        {topics.map((topic) => {
          const isOpen = openTopic === topic.title;

          return (
            <article key={topic.title} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
              <button
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-left transition hover:bg-era-paper sm:p-5"
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenTopic(isOpen ? null : topic.title)}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-era-sky text-xl" aria-hidden="true">
                  {topic.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-black text-era-navy">{topic.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{topic.summary}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-era-blue">{isOpen ? "Close" : "Read more"}</span>
              </button>

              {isOpen ? (
                <div className="border-t border-slate-200 bg-era-paper p-4 sm:p-5">
                  <div className="whitespace-pre-line text-sm leading-6 text-slate-700">{topic.text}</div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800 shadow-soft">
        If you feel unsafe, very unwell, or need urgent help, contact European Era or local emergency services immediately.
      </section>
    </DashboardShell>
  );
}
