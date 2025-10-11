import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Home,
    Users,
    CreditCard,
    FileText,
    BarChart3,
    MessageSquare,
    Calendar,
    Bell,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        current: true,
    },
    {
        name: "Users",
        href: "/users",
        icon: Users,
        current: false,
    },
    {
        name: "Billing",
        href: "/billing",
        icon: CreditCard,
        current: false,
    },
    {
        name: "Content",
        href: "/content",
        icon: FileText,
        current: false,
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        current: false,
    },
    {
        name: "Messages",
        href: "/messages",
        icon: MessageSquare,
        current: false,
    },
    {
        name: "Calendar",
        href: "/calendar",
        icon: Calendar,
        current: false,
    },
    {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
        current: false,
    },
];

interface SidebarProps {
    className?: string;
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ className, collapsed = false, onToggle }: SidebarProps) {
    return (
        <div className={cn("flex h-full flex-col bg-white border-r border-gray-200", className)}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
                {!collapsed && (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">MA</span>
                        </div>
                        <span className="font-semibold text-gray-900">MaxAI Platform</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="h-8 w-8 p-0"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    item.current
                                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("flex-shrink-0 h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
                <Link
                    href="/help"
                    className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors",
                        collapsed && "justify-center"
                    )}
                >
                    <HelpCircle className={cn("flex-shrink-0 h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                    {!collapsed && <span>Help & Support</span>}
                </Link>
            </div>
        </div>
    );
}