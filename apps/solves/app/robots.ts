import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/workbooks/*/edit",
        "/workbooks/*/solve",
        "/workbooks/*/report",
        "/workbooks/session",
        "/about-you",
        "/api/",
      ],
    },
    sitemap: "https://www.solves-ai.com/sitemap.xml",
  };
}
