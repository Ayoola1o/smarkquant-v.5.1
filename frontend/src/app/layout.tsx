"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "SmarkQuant - Quant Trading Platform",
//   description: "Advanced Jesse Framework GUI & Quant Research Extension",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname() || "/";
  const hideSidebar = ["/", "/login", "/signup"].includes(pathname);

  return (
    <html lang="en">
      <head>
        <title>SmarkQuant - Quant Trading Platform</title>
        <meta name="description" content="Advanced Jesse Framework GUI & Quant Research Extension" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        {!hideSidebar && <Sidebar />}
        <main className={`${hideSidebar ? "" : "ml-64"} min-h-screen`}>
          {children}
        </main>
        <Toaster position="bottom-right" richColors theme="dark" />
      </body>
    </html>
  );
}
