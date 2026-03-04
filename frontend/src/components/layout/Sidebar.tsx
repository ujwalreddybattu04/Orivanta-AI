"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
    {
        href: "/",
        label: "Search",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        ),
    },
    {
        href: "/discover",
        label: "Discover",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
        ),
    },
    {
        href: "/spaces",
        label: "Spaces",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
        ),
    },
    {
        href: "/library",
        label: "Library",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeThreadId = searchParams.get("id");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [threads, setThreads] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Read threads from local storage
    const loadThreads = () => {
        if (typeof window !== "undefined") {
            try {
                const threadsJson = localStorage.getItem("orivanta_threads");
                if (threadsJson) {
                    setThreads(JSON.parse(threadsJson));
                }
            } catch (e) {
                console.error("Failed to load threads", e);
            }
        }
    };

    useEffect(() => {
        loadThreads();
        window.addEventListener("orivanta_threads_updated", loadThreads);
        return () => window.removeEventListener("orivanta_threads_updated", loadThreads);
    }, []);

    // Inject variable dynamically for the main-content smooth transition
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--sidebar-width',
            isCollapsed ? '72px' : '240px'
        );
    }, [isCollapsed]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Filter threads
    const filteredThreads = threads.filter(t => {
        const s = searchQuery.toLowerCase();
        return (t.title || "").toLowerCase().includes(s) || (t.query || "").toLowerCase().includes(s);
    });

    return (
        <>
            {/* Mobile Burger Menu Button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
            </button>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`} id="main-sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <span className="sidebar-brand-name">Orivanta</span>

                    {/* Mobile Close Button */}
                    <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                            id={`nav-${item.label.toLowerCase()}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span className="sidebar-link-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-divider" />

                {/* New Thread */}
                <Link href="/" className="sidebar-new-thread" id="new-thread-btn" title={isCollapsed ? "New Thread" : undefined}>
                    <span className="sidebar-new-thread-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                    </span>
                    <span className="sidebar-link-label">New Thread</span>
                </Link>

                {/* Memory Ledger Section */}
                <div className="sidebar-divider" />
                <div className="sidebar-section">
                    <div className="sidebar-section-title">MEMORY LEDGER</div>

                    <div className="memory-search">
                        <svg className="memory-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        <input
                            type="text"
                            placeholder="Search threads..."
                            className="memory-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="memory-filters">
                        <button className="memory-filter active">All</button>
                        <button className="memory-filter">Today</button>
                        <button className="memory-filter">Yesterday</button>
                    </div>

                    <div className="memory-list">
                        {filteredThreads.length === 0 ? (
                            <div style={{ padding: "0 12px", color: "var(--text-muted)", fontSize: "12px" }}>
                                No threads found.
                            </div>
                        ) : (
                            filteredThreads.map((thread) => (
                                <Link
                                    key={thread.id}
                                    href={`/search?q=${encodeURIComponent(thread.query)}&id=${thread.id}`}
                                    className={`memory-item ${thread.id === activeThreadId ? 'active' : ''}`}
                                >
                                    {thread.title || thread.query}
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`sidebar-link sidebar-collapse-btn ${isCollapsed ? "collapsed-state" : ""}`}
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        <span className="sidebar-link-icon collapse-icon-container">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></svg>
                        </span>
                        <span className="sidebar-link-label">Collapse</span>
                    </button>

                    <Link href="/settings" className="sidebar-link" id="nav-settings" title={isCollapsed ? "Settings" : undefined}>
                        <span className="sidebar-link-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </span>
                        <span className="sidebar-link-label">Settings</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
