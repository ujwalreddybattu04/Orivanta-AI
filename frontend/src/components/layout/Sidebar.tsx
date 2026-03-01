"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/discover", label: "Discover", icon: "🔥" },
    { href: "/spaces", label: "Spaces", icon: "📁" },
    { href: "/library", label: "Library", icon: "📚" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar" id="main-sidebar">
            <nav className="sidebar-nav">
                <Link href="/" className="sidebar-logo">
                    <img src="/logo.svg" alt="Orivanta AI" width={28} height={28} />
                </Link>

                <div className="sidebar-links">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <Link href="/settings" className="sidebar-link">
                    <span className="sidebar-icon">⚙️</span>
                    <span className="sidebar-label">Settings</span>
                </Link>
            </div>
        </aside>
    );
}
