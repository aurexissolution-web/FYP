import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/dictionaries";

const ROUTES = [
  "",
  "features",
  "how-it-works",
  "research",
  "about",
  "privacy",
  "help",
  "contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://emobuddy.vercel.app";
  const entries: MetadataRoute.Sitemap = [];

  for (const route of ROUTES) {
    for (const lang of LOCALES) {
      entries.push({
        url: `${base}/${lang}${route ? `/${route}` : ""}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: route === "" ? 1 : 0.7,
      });
    }
  }

  return entries;
}
