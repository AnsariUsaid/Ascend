import type { Metadata, Viewport } from "next";
import { Poppins, DM_Sans } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ascend — Break the scroll. Get your time back.",
  description:
    "Ascend curbs screen time with cognitive friction, not hard blocks. Hit a limit and the effort to keep scrolling grows — so you stop on your own terms. Free, Android, and completely private.",
  keywords: [
    "screen time",
    "digital wellbeing",
    "app limits",
    "focus",
    "doomscrolling",
    "phone addiction",
    "Android",
  ],
  openGraph: {
    title: "Ascend — Break the scroll. Get your time back.",
    description:
      "Cognitive friction instead of hard blocks. Make the effort outgrow the urge to scroll.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7ECE1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
