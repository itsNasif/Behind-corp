import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return process.env.APP_ENV === "production"
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/account", "/admin", "/auth/", "/api/", "/dev-client"],
        },
        sitemap: `${process.env.APP_ORIGIN}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
