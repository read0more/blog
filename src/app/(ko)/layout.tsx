import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import "../globals.css";

export const metadata: Metadata = {
  title: "read0more's Blog",
  description: "개인 기술 블로그",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteLayout language="ko">{children}</SiteLayout>;
}
