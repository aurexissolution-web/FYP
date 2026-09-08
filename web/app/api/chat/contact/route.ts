import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { deleteEmergencyContact, getEmergencyContact, upsertEmergencyContact } from "@/lib/chat/emergency";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ contact: await getEmergencyContact(user.id) });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { id?: string; name?: string; relationship?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!name || !phone) {
    return NextResponse.json({ error: "name_and_phone_required" }, { status: 400 });
  }

  const contact = await upsertEmergencyContact(user.id, {
    id: body.id,
    name,
    relationship: body.relationship?.trim() || null,
    phone,
  });
  return NextResponse.json({ contact });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  await deleteEmergencyContact(user.id, id);
  return NextResponse.json({ ok: true });
}
