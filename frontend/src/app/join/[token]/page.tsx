"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { BRAND_NAME } from "@/config/constants";

const API_BASE =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? ""
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GroupInfo {
    token: string;
    creator_name: string;
    members: Array<{ id: string; name: string; is_creator: boolean }>;
    thread_data: { query?: string; answer?: string };
}

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/group-threads/${token}`);
                if (res.status === 404) {
                    setNotFound(true);
                    return;
                }
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setGroupInfo(data);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchGroup();
    }, [token]);

    const handleJoin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const name = displayName.trim();
        if (!name || joining) return;

        setJoining(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/v1/group-threads/${token}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ member_name: name }),
            });

            if (res.status === 404) {
                setError("This group thread no longer exists.");
                return;
            }

            if (!res.ok) throw new Error("Join failed");
            const data = await res.json();

            // Persist to sidebar
            try {
                const label = data.thread_data?.query
                    ? String(data.thread_data.query).slice(0, 40)
                    : "Group Thread";
                const stored = JSON.parse(localStorage.getItem("corten_group_threads") || "[]");
                const updated = [
                    { token, label, memberId: data.member_id },
                    ...stored.filter((g: { token: string }) => g.token !== token),
                ].slice(0, 10);
                localStorage.setItem("corten_group_threads", JSON.stringify(updated));
                window.dispatchEvent(new Event("corten_threads_updated"));
            } catch { /* ignore */ }

            router.push(`/group/${token}?member_id=${data.member_id}`);
        } catch {
            setError("Could not join the group thread. Please try again.");
        } finally {
            setJoining(false);
        }
    }, [displayName, joining, token, router]);

    if (loading) {
        return (
            <div className="join-page">
                <div className="join-card" style={{ alignItems: "center", justifyContent: "center", minHeight: 220 }}>
                    <div className="gtm-spinner" style={{ width: 20, height: 20 }} />
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="join-page">
                <div className="join-card" style={{ alignItems: "center", gap: 16, textAlign: "center" }}>
                    <div className="join-brand" style={{ justifyContent: "center" }}>
                        <div className="join-brand-dot">
                            <Users size={14} strokeWidth={2} />
                        </div>
                        <span className="join-brand-name">{BRAND_NAME}</span>
                    </div>
                    <div style={{ fontSize: "2rem" }}>🔗</div>
                    <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f2f2f2", margin: "0 0 8px" }}>
                            Link not found
                        </h2>
                        <p style={{ fontSize: "0.84rem", color: "#888", lineHeight: 1.55 }}>
                            This invite link may have expired or is invalid. Ask the creator for a new link.
                        </p>
                    </div>
                    <button
                        className="join-btn"
                        style={{ marginTop: 8 }}
                        onClick={() => router.push("/")}
                    >
                        Go to {BRAND_NAME}
                    </button>
                </div>
            </div>
        );
    }

    const memberCount = groupInfo?.members.length ?? 0;

    return (
        <div className="join-page">
            <div className="join-card">
                {/* Brand */}
                <div className="join-brand">
                    <div className="join-brand-dot">
                        <Users size={14} strokeWidth={2} />
                    </div>
                    <span className="join-brand-name">{BRAND_NAME}</span>
                </div>

                <div className="join-divider-line" />

                {/* Invite info */}
                <div>
                    <p className="join-invite-text">You're invited to join</p>
                    <h1 className="join-heading">
                        {BRAND_NAME} Group Thread
                        {groupInfo?.thread_data?.query
                            ? `: ${groupInfo.thread_data.query.slice(0, 48)}${groupInfo.thread_data.query.length > 48 ? "…" : ""}`
                            : ""}
                    </h1>
                    <p className="join-creator">
                        Started by <strong>{groupInfo?.creator_name}</strong>
                    </p>
                </div>

                {/* Member avatars */}
                {memberCount > 0 && (
                    <div className="join-members-preview">
                        <div className="join-member-avatars">
                            {groupInfo?.members.slice(0, 5).map((m) => (
                                <div key={m.id} className="join-avatar">
                                    {m.name.slice(0, 1)}
                                </div>
                            ))}
                        </div>
                        <span className="join-member-count">
                            {memberCount} {memberCount === 1 ? "member" : "members"} in this thread
                        </span>
                    </div>
                )}

                {/* Thread preview */}
                {groupInfo?.thread_data?.query && (
                    <div style={{
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "10px",
                    }}>
                        <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Thread topic
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#e2e2e2", fontWeight: 500, lineHeight: 1.4 }}>
                            {groupInfo.thread_data.query}
                        </div>
                    </div>
                )}

                {/* Join form */}
                <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="join-field">
                        <label>Your display name</label>
                        <input
                            type="text"
                            placeholder="e.g. Alex"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={32}
                            autoComplete="off"
                            autoFocus
                        />
                    </div>

                    {error && <div className="join-error">{error}</div>}

                    <button type="submit" className="join-btn" disabled={!displayName.trim() || joining}>
                        {joining ? "Joining…" : "Join Group Thread →"}
                    </button>
                </form>
            </div>
        </div>
    );
}
