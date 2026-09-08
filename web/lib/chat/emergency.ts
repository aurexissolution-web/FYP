import { createClient } from "@/lib/supabase/server";

/**
 * Server-side mirror of app/lib/services/emergency_contact_service.dart.
 * Both clients write/read the same emergency_contacts /
 * emergency_notifications rows, so a contact saved on the web is used by a
 * crisis detected in the app and vice versa. Changes here need a matching
 * change there.
 */

export type EmergencyContactRow = {
  id: string;
  name: string;
  relationship: string | null;
  phone: string;
  created_at: string;
};

/** The user's one contact (most recently created) — v1 UI only shows/edits
 * this single row. */
export async function getEmergencyContact(userId: string): Promise<EmergencyContactRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("id, name, relationship, phone, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getEmergencyContact failed: ${error.message}`);
  return (data as EmergencyContactRow | null) ?? null;
}

export async function upsertEmergencyContact(
  userId: string,
  args: { id?: string; name: string; relationship?: string | null; phone: string },
): Promise<EmergencyContactRow> {
  const supabase = await createClient();

  if (args.id) {
    const { data, error } = await supabase
      .from("emergency_contacts")
      .update({ name: args.name, relationship: args.relationship ?? null, phone: args.phone })
      .eq("id", args.id)
      .eq("user_id", userId)
      .select("id, name, relationship, phone, created_at")
      .single();
    if (error) throw new Error(`upsertEmergencyContact update failed: ${error.message}`);
    return data as EmergencyContactRow;
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({ user_id: userId, name: args.name, relationship: args.relationship ?? null, phone: args.phone })
    .select("id, name, relationship, phone, created_at")
    .single();
  if (error) throw new Error(`upsertEmergencyContact insert failed: ${error.message}`);
  return data as EmergencyContactRow;
}

export async function deleteEmergencyContact(userId: string, id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(`deleteEmergencyContact failed: ${error.message}`);
}

/**
 * Demo-ready stub: nothing is actually sent to the contact. This inserts a
 * real, timestamped emergency_notifications row so "the contact was
 * notified" is durable and auditable without a real SMS/WhatsApp/email
 * provider — wiring one in later only needs a dispatch call added here.
 *
 * userId comes from requireUser() in the calling route; moodLogId is the
 * mood_logs.id the crisis was logged against (== the chat session id).
 * Returns the notified contact's name, or null if the user has no saved
 * contact — callers thread that into their response either way, no error.
 */
export async function notifyEmergencyContactIfCrisis(
  userId: string,
  moodLogId: string,
): Promise<{ name: string } | null> {
  const contact = await getEmergencyContact(userId);
  if (!contact) return null;

  const supabase = await createClient();
  const { error } = await supabase.from("emergency_notifications").insert({
    user_id: userId,
    contact_id: contact.id,
    mood_log_id: moodLogId,
    contact_name_snapshot: contact.name,
    contact_phone_snapshot: contact.phone,
  });
  if (error) throw new Error(`notifyEmergencyContactIfCrisis insert failed: ${error.message}`);

  return { name: contact.name };
}
