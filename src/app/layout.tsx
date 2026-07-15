import type { Metadata } from "next";
import { Luckiest_Guy } from "next/font/google";
import "./globals.css";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BTD6 Progress — Map Medal Tracker",
  description:
    "Track Bloons TD 6 solo map medals through Version 55 (2026), with OAK auto-sync from Ninja Kiwi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="day"
      className={luckiestGuy.variable}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
