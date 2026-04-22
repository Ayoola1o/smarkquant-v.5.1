"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import { AuthProvider } from "../../lib/auth-context";
import { SidebarProvider } from "@/lib/sidebar-context";

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <AuthProvider>
          <SidebarProvider>
            {!hideSidebar && <Sidebar />}
            <main className={`min-h-screen transition-all duration-300 ${hideSidebar ? "" : "md:ml-64"} p-4 md:p-6`}>
              {children}
            </main>
            <Toaster position="bottom-right" richColors theme="dark" />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
