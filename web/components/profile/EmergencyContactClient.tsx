"use client";

import { useState } from "react";
import { Pencil, Phone, Trash, UserPlus } from "lucide-react";
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
    <div className="rounded-2xl border border-outline/70 bg-white p-5">
      <div className="mb-1 flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-ink">{dict.title}</h2>
        <p className="text-xs text-ink-faint">{dict.subtitle}</p>
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
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-tint text-coral-deep">
            <Phone size={16} />
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
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-sm text-ink-soft">{dict.emptyBody}</p>
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-tint px-4 py-2 text-xs font-bold text-indigo transition-colors hover:bg-indigo/20"
          >
            <UserPlus size={14} />
            {dict.addButton}
          </button>
        </div>
      )}
    </div>
  );
}
