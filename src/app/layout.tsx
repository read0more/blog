import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getCategories, getAllPostMeta } from "@/lib/posts";
import "./globals.css";

export const metadata: Metadata = {
  title: "read0more",
  description: "개인 기술 블로그",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, posts] = await Promise.all([
    getCategories(),
    getAllPostMeta(),
  ]);

  return (
    <html lang="ko">
      <body>
        <AppShell categories={categories} totalCount={posts.length}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
