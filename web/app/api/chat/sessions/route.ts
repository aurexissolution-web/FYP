import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  deleteSession,
  getSessionMessages,
  listSessions,
} from "@/lib/chat/sessions";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    return NextResponse.json({ messages: await getSessionMessages(user.id, id) });
  }
  return NextResponse.json({ sessions: await listSessions(user.id) });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  await deleteSession(user.id, id);
  return NextResponse.json({ ok: true });
}
