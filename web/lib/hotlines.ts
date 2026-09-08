// Mirrors ml-service/app/hotlines.py exactly. This is the site's single
// source of truth for crisis numbers — the /get-help page and the in-chat
// crisis card both read from here, so they can never drift out of sync with
// each other. If the model service is unreachable, this still renders.

export type HotlineEntry = {
  name: string;
  phone: string;
  telHref: string;
  description: string;
};

export type Locale = "en" | "ms";

const HOTLINES_EN: HotlineEntry[] = [
  {
    name: "Talian Kasih",
    phone: "15999",
    telHref: "tel:15999",
    description:
      "24-hour national helpline (Ministry of Women, Family and Community Development). WhatsApp: 019-261 5999.",
  },
  {
    name: "Talian HEAL",
    phone: "15555",
    telHref: "tel:15555",
    description: "Ministry of Health 24-hour mental health support line.",
  },
  {
    name: "Befrienders Kuala Lumpur",
    phone: "03-7627 2929",
    telHref: "tel:0376272929",
    description: "24-hour confidential emotional support.",
  },
];

const HOTLINES_MS: HotlineEntry[] = [
  {
    name: "Talian Kasih",
    phone: "15999",
    telHref: "tel:15999",
    description:
      "Talian bantuan negara 24 jam (Kementerian Pembangunan Wanita, Keluarga dan Masyarakat). WhatsApp: 019-261 5999.",
  },
  {
    name: "Talian HEAL",
    phone: "15555",
    telHref: "tel:15555",
    description:
      "Talian sokongan kesihatan mental 24 jam, Kementerian Kesihatan Malaysia.",
  },
  {
    name: "Befrienders Kuala Lumpur",
    phone: "03-7627 2929",
    telHref: "tel:0376272929",
    description: "Sokongan emosi sulit secara sulit, 24 jam.",
  },
];

export function getHotlines(locale: Locale): HotlineEntry[] {
  return locale === "ms" ? HOTLINES_MS : HOTLINES_EN;
}
