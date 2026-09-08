import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://emobuddy.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/en/chat", "/ms/chat", "/en/login", "/ms/login", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
