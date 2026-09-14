import type { Metadata } from "next";
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
  title: "FOLO - Financial Budget & Goal Planner",
  description: "Take control of your finances with FOLO. Track budgets, manage transactions, and achieve your financial goals with our modern, easy-to-use app.",
  icons: {
    icon: "/folo_icon_obsidian.png",
    apple: "/folo_icon_obsidian.png",
  },
  themeColor: "#0B0F17",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
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
