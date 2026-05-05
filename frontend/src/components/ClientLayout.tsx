"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/lib/sidebar-context";

const HIDE_SIDEBAR_ROUTES = ["/", "/login", "/signup", "/pricing", "/about", "/contact"];

function MainContent({ children, hideSidebar }: { children: React.ReactNode; hideSidebar: boolean }) {
    const { isOpen } = useSidebar();

    return (
        <main
            className={`min-h-screen transition-all duration-300 ${hideSidebar ? "" : isOpen ? "md:ml-64" : "md:ml-20"
                } p-4 md:p-6`}
        >
            {children}
        </main>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "/";
    const hideSidebar = HIDE_SIDEBAR_ROUTES.includes(pathname);

    return (
        <>
            {!hideSidebar && <Sidebar />}
            <MainContent hideSidebar={hideSidebar}>{children}</MainContent>
        </>
    );
}
