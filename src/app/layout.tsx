import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sound & Technical",
    template: "%s | Sound & Technical",
  },
  description:
    "Internal platform for the Sound & Technical Department of Hope Nation Church.",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/assets/favicon.png", type: "image/png" }],
    shortcut: [{ url: "/assets/favicon.png", type: "image/png" }],
    apple: [{ url: "/assets/favicon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
