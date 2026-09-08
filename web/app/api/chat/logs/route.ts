import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { fetchMoodLogs } from "@/lib/chat/sessions";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ logs: await fetchMoodLogs(user.id) });
}
