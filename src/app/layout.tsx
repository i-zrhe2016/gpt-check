import type { Metadata } from "next";
import { headers } from "next/headers";

import { normalizeLocale } from "@/lib/locale";
import { getSiteDescription, getSiteName, getSiteTitle, resolveSiteUrl } from "@/lib/site";

import "./globals.css";

const siteUrl = resolveSiteUrl();
const defaultSiteName = getSiteName();
const defaultSiteTitle = getSiteTitle();
const defaultSiteDescription = getSiteDescription();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: defaultSiteName,
  title: {
    default: `${defaultSiteTitle} | ${defaultSiteName}`,
    template: `%s | ${defaultSiteName}`,
  },
  description: defaultSiteDescription,
  keywords: [
    "模型掺水检测",
    "大模型降配检测",
    "模型错配识别",
    "GPT 模型真实性检测",
    "OpenAI 兼容接口检测",
    "model downgrade detection",
    "model authenticity check",
  ],
  category: "developer tools",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: defaultSiteName,
    title: `${defaultSiteTitle} | ${defaultSiteName}`,
    description: defaultSiteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${defaultSiteTitle} | ${defaultSiteName}`,
    description: defaultSiteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const locale = normalizeLocale(headerStore.get("x-app-locale"));

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
