"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pin, PinOff, MoreHorizontal, Eraser, Trash2, Edit3, Users } from "lucide-react";
import { BRAND_NAME, STORAGE_KEYS, EVENTS } from "@/config/constants";

const NAV_ITEMS = [
    {
        href: "/",
        label: "Search",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="21" y2="16.65" />
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

    const [groupThreads, setGroupThreads] = useState<Array<{ token: string; label: string; memberId: string }>>([]);

    // Thread management state
    const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>([]);
    const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [threadToDelete, setThreadToDelete] = useState<{ id: string, title: string } | null>(null);

    // Read threads and pins from local storage
    const loadThreads = () => {
        if (typeof window !== "undefined") {
            try {
                // Logic: Prefer Current Brand, Fallback to Legacy for migration
                let threadsJson = localStorage.getItem(STORAGE_KEYS.THREADS);
                if (!threadsJson) {
                    threadsJson = localStorage.getItem("orivanta_threads");
                    if (threadsJson) {
                        localStorage.setItem(STORAGE_KEYS.THREADS, threadsJson);
                    }
                }

                if (threadsJson) {
                    setThreads(JSON.parse(threadsJson));
                }

                let pinsJson = localStorage.getItem(STORAGE_KEYS.PINNED_THREADS);
                if (!pinsJson) {
                    pinsJson = localStorage.getItem("orivanta_pinned_threads");
                    if (pinsJson) {
                        localStorage.setItem(STORAGE_KEYS.PINNED_THREADS, pinsJson);
                    }
                }

                if (pinsJson) {
                    setPinnedThreadIds(JSON.parse(pinsJson));
                }

                const gtJson = localStorage.getItem("corten_group_threads");
                if (gtJson) {
                    setGroupThreads(JSON.parse(gtJson));
                }
            } catch (e) {
                console.error("Failed to load threads", e);
            }
        }
    };

    useEffect(() => {
        loadThreads();
        window.addEventListener(EVENTS.THREADS_UPDATED, loadThreads);

        // Close menu on click outside
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener(EVENTS.THREADS_UPDATED, loadThreads);
            window.removeEventListener("click", handleClickOutside);
        };
    }, []);

    // Sync collapsed state with CSS variable for layout consistency
    useEffect(() => {
        if (typeof window !== "undefined") {
            const width = isCollapsed ? "72px" : "240px";
            document.documentElement.style.setProperty("--sidebar-width", width);
        }
    }, [isCollapsed]);

    // Thread Actions
    const togglePin = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newPins = pinnedThreadIds.includes(id)
            ? pinnedThreadIds.filter(pid => pid !== id)
            : [id, ...pinnedThreadIds];

        setPinnedThreadIds(newPins);
        localStorage.setItem(STORAGE_KEYS.PINNED_THREADS, JSON.stringify(newPins));
        setActiveMenuId(null);
    };

    const handleDeleteClick = (e: React.MouseEvent, thread: any) => {
        e.preventDefault();
        e.stopPropagation();
        setThreadToDelete({ id: thread.id, title: thread.title || thread.query });
        setShowDeleteModal(true);
        setActiveMenuId(null);
    };

    const confirmDelete = () => {
        if (!threadToDelete) return;

        const { id } = threadToDelete;
        const updatedThreads = threads.filter(t => t.id !== id);
        setThreads(updatedThreads);
        localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(updatedThreads));

        // Also remove from pins if present
        const updatedPins = pinnedThreadIds.filter(pid => pid !== id);
        setPinnedThreadIds(updatedPins);
        localStorage.setItem(STORAGE_KEYS.PINNED_THREADS, JSON.stringify(updatedPins));

        window.dispatchEvent(new Event(EVENTS.THREADS_UPDATED));

        // If we are on the deleted thread, go home
        if (activeThreadId === id) {
            router.push("/");
        }

        closeDeleteModal();
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setThreadToDelete(null);
    };

    const startRename = (e: React.MouseEvent, thread: any) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingThreadId(thread.id);
        setEditingTitle(thread.title || thread.query);
        setActiveMenuId(null);
    };

    const saveRename = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingThreadId) return;

        const updatedThreads = threads.map(t =>
            t.id === editingThreadId ? { ...t, title: editingTitle } : t
        );

        setThreads(updatedThreads);
        localStorage.setItem("corten_threads", JSON.stringify(updatedThreads));
        window.dispatchEvent(new Event("corten_threads_updated"));

        setEditingThreadId(null);
        setEditingTitle("");
    };

    // Filter AND Sort (Pins go first)
    const filteredThreads = threads
        .filter(t => {
            const s = searchQuery.toLowerCase();
            return (t.title || "").toLowerCase().includes(s) || (t.query || "").toLowerCase().includes(s);
        })
        .sort((a, b) => {
            const aPinned = pinnedThreadIds.includes(a.id);
            const bPinned = pinnedThreadIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0; // Maintain relative order for same pin status
        });

    return (
        <>
            {/* Mobile Burger Menu Button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open menu"
                suppressHydrationWarning
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
                    <span className="sidebar-brand-name">Corten</span>

                    {/* Mobile Close Button */}
                    <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)} suppressHydrationWarning>
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
                            suppressHydrationWarning
                        />
                    </div>

                    <div className="memory-filters">
                        <button className="memory-filter active" suppressHydrationWarning>All</button>
                        <button className="memory-filter" suppressHydrationWarning>Today</button>
                        <button className="memory-filter" suppressHydrationWarning>Yesterday</button>
                    </div>

                    <div className="memory-list">
                        {filteredThreads.length === 0 ? (
                            <div style={{ padding: "0 12px", color: "var(--text-muted)", fontSize: "12px" }}>
                                No threads found.
                            </div>
                        ) : (
                            filteredThreads.map((thread) => (
                                <div key={thread.id} className="memory-item-wrapper">
                                    {editingThreadId === thread.id ? (
                                        <form className="memory-rename-form" onSubmit={saveRename}>
                                            <input
                                                autoFocus
                                                className="memory-rename-input"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onBlur={() => saveRename()}
                                                onKeyDown={(e) => e.key === "Escape" && setEditingThreadId(null)}
                                            />
                                        </form>
                                    ) : (
                                        <Link
                                            href={`/search?q=${encodeURIComponent(thread.query)}&id=${thread.id}`}
                                            className={`memory-item ${thread.id === activeThreadId ? 'active' : ''}`}
                                        >
                                            <span className="memory-item-text">
                                                {pinnedThreadIds.includes(thread.id) && (
                                                    <Pin size={12} className="pin-indicator" fill="currentColor" />
                                                )}
                                                {thread.title || thread.query}
                                            </span>

                                            <div className="memory-item-actions">
                                                <button
                                                    className={`more-actions-btn ${activeMenuId === thread.id ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === thread.id ? null : thread.id);
                                                    }}
                                                    suppressHydrationWarning
                                                >
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </Link>
                                    )}

                                    {activeMenuId === thread.id && (
                                        <div className="thread-context-menu" onClick={(e) => e.stopPropagation()}>
                                            <button className="menu-item" onClick={(e) => startRename(e, thread)} suppressHydrationWarning>
                                                <Edit3 size={12} />
                                                Rename
                                            </button>
                                            <button className="menu-item" onClick={(e) => togglePin(e, thread.id)} suppressHydrationWarning>
                                                {pinnedThreadIds.includes(thread.id) ? (
                                                    <>
                                                        <PinOff size={12} strokeWidth={2} />
                                                        Unpin
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pin size={12} strokeWidth={2} />
                                                        Pin
                                                    </>
                                                )}
                                            </button>
                                            <div className="menu-divider" />
                                            <button className="menu-item delete" onClick={(e) => handleDeleteClick(e, thread)} suppressHydrationWarning>
                                                <Trash2 size={12} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Group Threads Section */}
                {groupThreads.length > 0 && (
                    <>
                        <div className="sidebar-divider" />
                        <div className="sidebar-section">
                            <div className="sidebar-section-title" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Users size={10} />
                                GROUP THREADS
                            </div>
                            <div className="sidebar-group-threads">
                                {groupThreads.slice(0, 5).map((gt) => (
                                    <Link
                                        key={gt.token}
                                        href={`/group/${gt.token}?member_id=${gt.memberId}`}
                                        className="sidebar-group-thread-item"
                                        title={gt.label}
                                    >
                                        <span className="sidebar-group-thread-dot" />
                                        <span className="sidebar-group-thread-label">{gt.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="sidebar-footer">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`sidebar-link sidebar-collapse-btn ${isCollapsed ? "collapsed-state" : ""}`}
                        title={isCollapsed ? "Expand" : "Collapse"}
                        suppressHydrationWarning
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Delete chat?</h3>
                        <p className="modal-msg">
                            This will delete <strong>{threadToDelete?.title}</strong>.
                            <br />
                            <span className="modal-submsg">Visit settings to delete any memories saved during this chat.</span>
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn modal-btn--cancel" onClick={closeDeleteModal} suppressHydrationWarning>
                                Cancel
                            </button>
                            <button className="modal-btn modal-btn--delete" onClick={confirmDelete} suppressHydrationWarning>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
