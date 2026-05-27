"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallCard() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      return;
    }

    setShowIosHelp(isIos());
    setIsVisible(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowIosHelp(false);
      setIsVisible(true);
    }

    function handleInstalled() {
      setIsVisible(false);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setShowIosHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      setIsVisible(false);
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <section className="mb-5 rounded-lg border border-era-orange bg-white p-4 shadow-soft sm:hidden">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-era-sky text-era-blue">
          <Download className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-era-navy">Install StudentHub</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">Add StudentHub to your phone home screen for quick access.</p>
          {showIosHelp && !installPrompt ? (
            <p className="mt-2 rounded-md bg-era-paper p-2 text-sm font-semibold text-era-navy">
              On iPhone: tap Share, then Add to Home Screen.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="min-h-10 rounded-md bg-era-blue px-3 py-2 text-sm font-bold text-white"
              type="button"
              onClick={installApp}
            >
              Install StudentHub
            </button>
            <button
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-era-navy"
              type="button"
              onClick={() => setIsVisible(false)}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
