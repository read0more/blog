import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { siteMetadata } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  ...siteMetadata("en"),
  title: "read0more's Blog — English",
};

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout language="en">{children}</SiteLayout>;
}
