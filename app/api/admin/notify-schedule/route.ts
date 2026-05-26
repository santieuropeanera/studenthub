import { NextResponse } from "next/server";
import { notifyScheduleCreated } from "@/lib/services/notifications";
import { scheduleItems, users } from "@/lib/demo-data";

export async function POST() {
  const item = scheduleItems[0];
  const recipients = users
    .filter((user) => user.groupId && item.groupIds.includes(user.groupId))
    .map((user) => ({ email: user.email, fullName: user.fullName }));

  const logs = await notifyScheduleCreated(item, recipients);
  return NextResponse.json({ ok: true, logs });
}
