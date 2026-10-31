import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luma Market | Objects for clearer days",
  description: "Thoughtfully designed desk, audio, and everyday objects.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
