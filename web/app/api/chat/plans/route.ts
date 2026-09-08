import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { toggleSelfCare } from "@/lib/chat/sessions";

export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { planId?: string; completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.planId || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "planId_and_completed_required" }, { status: 400 });
  }

  await toggleSelfCare(body.planId, body.completed);
  return NextResponse.json({ ok: true });
}
