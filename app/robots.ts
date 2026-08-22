import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/api/", "/account", "/admin", "/signin", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
