import type { Metadata } from "next";

import { resolveSiteUrl, siteDescription, siteName, siteTitle } from "@/lib/site";

import "./globals.css";

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: `${siteTitle} | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
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
    siteName,
    title: `${siteTitle} | ${siteName}`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} | ${siteName}`,
    description: siteDescription,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
