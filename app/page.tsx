import Link from "next/link";
import { GraduationCap, UsersRound } from "lucide-react";
import { HomeAuthRedirect } from "@/components/home-auth-redirect";

const loginCards = [
  {
    href: "/student",
    title: "Student access",
    description: "Profile, internship, accommodation, medical help, schedule, activities, and emergency support.",
    icon: GraduationCap
  },
  {
    href: "/teacher",
    title: "Teacher access",
    description: "Students from your assigned group, daily schedule, and key mobility information.",
    icon: UsersRound
  }
];

const faqs = [
  {
    question: "What is StudentHub?",
    answer:
      "StudentHub is your European Era mobility portal. It helps you find your internship information, accommodation details, assigned medical center, schedule, activities, and emergency support in one place."
  },
  {
    question: "Who can use StudentHub?",
    answer: "StudentHub is designed for students and teachers taking part in European Era mobility programmes."
  },
  {
    question: "What information can students find?",
    answer:
      "Students can view their internship placement, working hours, accommodation details, assigned hospital or medical center, group schedule, activities, and emergency contact options."
  },
  {
    question: "What can teachers see?",
    answer: "Teachers can access relevant group information, student details, and schedule updates."
  },
  {
    question: "Where does my information come from?",
    answer: "Your information is prepared by the European Era team and synced securely into StudentHub."
  },
  {
    question: "What should I do if something looks wrong?",
    answer: "Contact the European Era team through the WhatsApp contact button or speak with your coordinator."
  },
  {
    question: "What should I do if I feel sick?",
    answer:
      "Go to the Assigned Hospital / Medical Help section in your profile and open the \"Feeling sick?\" guide. It explains what to bring, where to go, and how to ask for medical assistance."
  },
  {
    question: "Is StudentHub available on mobile?",
    answer: "Yes. StudentHub is designed to work on both mobile and desktop devices."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-era-paper">
      <HomeAuthRedirect />
      <section className="bg-white">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-7 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  className="h-12 w-auto max-w-[132px] shrink-0 object-contain sm:h-16 sm:max-w-[165px]"
                  src="/images/Logo%20Web.png"
                  alt="European Era logo"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-era-teal sm:text-sm">European Era</p>
                  <p className="text-lg font-black text-era-navy sm:text-xl">StudentHub</p>
                </div>
              </div>
              <Link className="shrink-0 text-xs font-semibold text-slate-500 hover:text-era-blue sm:text-sm" href="/admin">
                Admin access
              </Link>
            </div>
            <h1 className="max-w-3xl text-3xl font-black leading-tight text-era-navy sm:text-5xl">
              Daily mobility support for students and teachers.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              A secure, mobile-first dashboard for Erasmus+ internships, accommodation, activities, schedules, medical help,
              emergency support, and mobility coordination in Málaga.
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-era-blue px-5 py-3 font-bold text-white shadow-soft hover:bg-era-navy sm:w-auto" href="/login">
                Sign in
              </Link>
              {loginCards.map((card) => (
                <Link
                  key={card.href}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-era-orange bg-white px-5 py-3 font-bold text-era-navy shadow-sm hover:border-era-blue hover:text-era-blue sm:w-auto"
                  href={card.href}
                >
                  <card.icon className="h-4 w-4" aria-hidden="true" />
                  {card.title}
                </Link>
              ))}
            </div>
            <img
              className="hidden"
              src="/images/studenthub-mascot.png"
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="hidden items-center lg:flex">
            <div className="grid w-full gap-4 sm:gap-6">
              <img
                className="hidden h-[26rem] max-w-full justify-self-center object-contain drop-shadow-xl lg:block xl:h-[30rem]"
                src="/images/studenthub-mascot.png"
                alt=""
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-era-teal">FAQ</p>
          <h2 className="mt-2 text-2xl font-black text-era-navy sm:text-3xl">StudentHub questions</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
              <h3 className="font-black text-era-navy">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
