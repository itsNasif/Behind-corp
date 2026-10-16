import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.APP_ENV !== "production") return [];
  return [
    "",
    "/technology",
    "/company",
    "/vision",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({ url: `${process.env.APP_ORIGIN}${path}` }));
}
