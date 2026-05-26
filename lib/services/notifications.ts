import { Resend } from "resend";
import { appConfig } from "@/lib/config";
import type { Activity, ScheduleItem } from "@/types/studenthub";

type Recipient = {
  email: string;
  fullName: string;
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function notifyScheduleCreated(item: ScheduleItem, recipients: Recipient[]) {
  const subject = `New StudentHub schedule item: ${item.title}`;
  const html = renderNotificationEmail({
    title: item.title,
    dateTime: `${item.date}, ${item.startTime} - ${item.endTime}`,
    location: item.location,
    description: item.description
  });

  return sendNotificationEmails(subject, html, recipients);
}

export async function notifyActivityCreated(activity: Activity, recipients: Recipient[]) {
  const subject = `New European Era activity: ${activity.title}`;
  const html = renderNotificationEmail({
    title: activity.title,
    dateTime: `${activity.date}, ${activity.time}`,
    location: activity.location,
    description: activity.description
  });

  return sendNotificationEmails(subject, html, recipients);
}

async function sendNotificationEmails(subject: string, html: string, recipients: Recipient[]) {
  const logs = [];

  for (const recipient of recipients) {
    try {
      if (!resend) {
        logs.push({ email: recipient.email, status: "skipped", error: "RESEND_API_KEY is not configured" });
        continue;
      }

      const result = await resend.emails.send({
        from: appConfig.emailFrom,
        to: recipient.email,
        subject,
        html
      });

      logs.push({ email: recipient.email, status: "sent", providerId: result.data?.id });
    } catch (error) {
      logs.push({
        email: recipient.email,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown email error"
      });
    }
  }

  return logs;
}

function renderNotificationEmail({
  title,
  dateTime,
  location,
  description
}: {
  title: string;
  dateTime: string;
  location: string;
  description: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #172033; line-height: 1.6;">
      <h1 style="color: #32409c;">${title}</h1>
      <p><strong>Date and time:</strong> ${dateTime}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p>${description}</p>
      <p>
        <a href="${appConfig.appUrl}" style="background: #32409c; color: white; padding: 12px 16px; border-radius: 6px; text-decoration: none;">
          Open StudentHub
        </a>
      </p>
    </div>
  `;
}
