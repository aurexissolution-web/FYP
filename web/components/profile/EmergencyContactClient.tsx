"use client";

import { useState } from "react";
import { Pencil, Phone, ShieldCheck, Trash, UserPlus } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import type { EmergencyContactRow } from "@/lib/chat/emergency";

export function EmergencyContactClient({
  dict,
  initialContact,
}: {
  dict: Dictionary["emergencyContact"];
  initialContact: EmergencyContactRow | null;
}) {
  const [contact, setContact] = useState(initialContact);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialContact?.name ?? "");
  const [relationship, setRelationship] = useState(initialContact?.relationship ?? "");
  const [phone, setPhone] = useState(initialContact?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setName(contact?.name ?? "");
    setRelationship(contact?.relationship ?? "");
    setPhone(contact?.phone ?? "");
    setError(null);
    setEditing(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setError(dict.errorRequired);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/chat/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contact?.id,
          name: trimmedName,
          relationship: relationship.trim(),
          phone: trimmedPhone,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data: { contact: EmergencyContactRow } = await response.json();
      setContact(data.contact);
      setEditing(false);
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!contact) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/chat/contact?id=${contact.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(String(response.status));
      setContact(null);
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_22px_55px_-38px_rgba(46,42,58,0.5)] ring-1 ring-outline/40 sm:p-7">
      <div className="flex items-start gap-4 border-b border-outline/50 pb-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral-tint text-coral-deep"><ShieldCheck size={19} /></span>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">{dict.title}</h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-faint">{dict.subtitle}</p>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ec-name" className="text-xs font-semibold text-ink-soft">
              {dict.nameLabel}
            </label>
            <input
              id="ec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-outline bg-white px-3.5 py-2 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/30"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ec-relationship" className="text-xs font-semibold text-ink-soft">
              {dict.relationshipLabel}
            </label>
            <input
              id="ec-relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder={dict.relationshipPlaceholder}
              className="rounded-xl border border-outline bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ec-phone" className="text-xs font-semibold text-ink-soft">
              {dict.phoneLabel}
            </label>
            <input
              id="ec-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-outline bg-white px-3.5 py-2 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/30"
              required
            />
          </div>

          {error && <p className="text-xs font-semibold text-coral-deep">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-indigo px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {dict.saveButton}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-full border border-outline px-4 py-2 text-xs font-bold text-ink-faint transition-colors hover:bg-cream-alt"
            >
              {dict.cancelButton}
            </button>
          </div>
        </form>
      ) : contact ? (
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-coral-tint/45 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-coral-deep shadow-sm">
            <Phone size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{contact.name}</p>
            <p className="truncate text-xs text-ink-faint">
              {[contact.relationship, contact.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={startEdit}
            aria-label={dict.editButton}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream-alt hover:text-ink"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            aria-label={dict.removeButton}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-coral-tint hover:text-coral-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash size={15} />
          </button>
        </div>
      ) : (
        <div className="mt-5 flex min-h-40 flex-col items-start justify-between rounded-2xl border border-dashed border-outline bg-cream/60 p-5">
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">{dict.emptyBody}</p>
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_-14px_rgba(74,63,99,0.75)] transition-colors hover:bg-indigo-deep"
          >
            <UserPlus size={14} />
            {dict.addButton}
          </button>
        </div>
      )}
    </section>
  );
}
