import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import "../globals.css";

export const metadata: Metadata = {
  title: "read0more's Blog — English",
  description:
    "Selected articles on frontend development, translated into English.",
};

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout language="en">{children}</SiteLayout>;
}
