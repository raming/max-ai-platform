"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="h-screen flex bg-gray-50">
            {/* Sidebar */}
            <div
                className={`hidden lg:flex transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-16" : "w-64"
                    }`}
            >
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    onSidebarToggle={toggleSidebar}
                />

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}