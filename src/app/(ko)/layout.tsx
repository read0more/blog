import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SITE_NAME, siteMetadata, siteViewport } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  ...siteMetadata("ko"),
  title: SITE_NAME,
};
export const viewport = siteViewport;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteLayout language="ko">{children}</SiteLayout>;
}
