import type { MetadataRoute } from "next";

// ✏️ Update the sitemap URL and rules to match your project.
// Disallow paths you don't want search engines to index (admin, API, auth pages, etc.)

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
