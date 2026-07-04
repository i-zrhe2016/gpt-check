import type { MetadataRoute } from "next";

import { resolveAbsoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: resolveAbsoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: resolveAbsoluteUrl("/en"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
