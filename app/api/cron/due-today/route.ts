import { NextResponse } from "next/server";
import { isReminderHour, runDueTodayJob } from "@/lib/notifications/due-today";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!isReminderHour()) {
    return NextResponse.json({ ran: false, reason: "not reminder hour" });
  }

  const result = await runDueTodayJob();
  return NextResponse.json({ ran: true, ...result });
}
