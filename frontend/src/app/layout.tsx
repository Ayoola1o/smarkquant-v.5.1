import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "../../lib/auth-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "SmarkQuant - Quant Trading Platform",
  description: "Advanced Jesse Framework GUI & Quant Research Extension",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SmarkQuant" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/favicon-180x180.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className="antialiased bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        <AuthProvider>
          <SidebarProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster position="bottom-right" richColors theme="dark" />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
