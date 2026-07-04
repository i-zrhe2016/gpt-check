import type { Metadata } from "next";

import { getSiteDescription, getSiteName, getSiteTitle } from "@/lib/site";

const siteName = getSiteName("en");
const siteTitle = getSiteTitle("en");
const siteDescription = getSiteDescription("en");

export const metadata: Metadata = {
  title: {
    default: `${siteTitle} | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    locale: "en_US",
    title: `${siteTitle} | ${siteName}`,
    description: siteDescription,
    siteName,
  },
  twitter: {
    title: `${siteTitle} | ${siteName}`,
    description: siteDescription,
  },
};

export default function EnglishLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
