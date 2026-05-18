import type { Metadata } from "next";

import "./globals.css";

const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "MyLink - One profile for every link",
    template: "%s | MyLink"
  },
  description:
    "MyLink is a self-hosted Linktree-style profile builder with Google login, link management, click tracking, and dynamic sharing images.",
  openGraph: {
    title: "MyLink",
    description:
      "Create a public profile page for every important link you share.",
    url: appUrl,
    siteName: "MyLink",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
