import { MessageCircle } from "lucide-react";
import { appConfig, buildWhatsAppUrl } from "@/lib/config";

type WhatsAppButtonProps = {
  message: string;
  label?: string;
  className?: string;
};

export function WhatsAppButton({ message, label = "WhatsApp", className = "" }: WhatsAppButtonProps) {
  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#24d366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1fb85a] ${className}`}
      href={buildWhatsAppUrl(appConfig.whatsappNumber, message)}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
