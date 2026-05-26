export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  whatsappNumber: process.env.EUROPEAN_ERA_WHATSAPP_NUMBER ?? "34617916957",
  emergencyPhone: process.env.EUROPEAN_ERA_EMERGENCY_PHONE ?? "34617916957",
  emailFrom: process.env.EMAIL_FROM ?? "European Era StudentHub <studenthub@example.com>"
};

export function buildWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function buildMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
