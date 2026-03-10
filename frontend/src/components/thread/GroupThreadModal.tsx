"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Copy, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? ""
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GroupThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    query?: string;
    answer?: string;
}

type Step = "name" | "link";

export default function GroupThreadModal({
    isOpen,
    onClose,
    query,
    answer,
}: GroupThreadModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("name");
    const [displayName, setDisplayName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [groupToken, setGroupToken] = useState("");
    const [memberId, setMemberId] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep("name");
            setDisplayName("");
            setIsCreating(false);
            setInviteLink("");
            setGroupToken("");
            setMemberId("");
            setCopied(false);
            setError("");
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleCreate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const name = displayName.trim();
        if (!name || isCreating) return;

        setIsCreating(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/v1/group-threads/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creator_name: name,
                    thread_data: query
                        ? { query, answer: answer?.slice(0, 500) }
                        : undefined,
                }),
            });

            if (!res.ok) throw new Error("Failed to create group thread");
            const data = await res.json();

            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const link = `${origin}/join/${data.token}`;

            setGroupToken(data.token);
            setMemberId(data.creator_id);
            setInviteLink(link);
            setStep("link");

            // Persist to sidebar
            try {
                const label = query ? query.slice(0, 40) : `Group Thread`;
                const stored = JSON.parse(localStorage.getItem("corten_group_threads") || "[]");
                const updated = [{ token: data.token, label, memberId: data.creator_id }, ...stored].slice(0, 10);
                localStorage.setItem("corten_group_threads", JSON.stringify(updated));
                window.dispatchEvent(new Event("corten_threads_updated"));
            } catch { /* ignore */ }
        } catch {
            setError("Could not create group thread. Please try again.");
        } finally {
            setIsCreating(false);
        }
    }, [displayName, isCreating, query, answer]);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }, [inviteLink]);

    const handleEnterThread = useCallback(() => {
        onClose();
        router.push(`/group/${groupToken}?member_id=${memberId}`);
    }, [groupToken, memberId, router, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="gtm-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="gtm-positioner" role="dialog" aria-modal="true" aria-label="Start group thread">
                        <motion.div
                            className="gtm-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 14 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 14 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* Header */}
                            <div className="gtm-header">
                                <div className="gtm-header-left">
                                    <div className="gtm-icon-wrap">
                                        <Users size={17} strokeWidth={2} />
                                    </div>
                                    <h2 className="gtm-title">
                                        {step === "name" ? "Start Group Thread" : "Invite Members"}
                                    </h2>
                                </div>
                                <button className="gtm-close" onClick={onClose} aria-label="Close">
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* ── Step 1: Enter name ── */}
                            {step === "name" && (
                                <>
                                    <p className="gtm-desc">
                                        Invite others to view and discuss this thread together in real-time.
                                    </p>

                                    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <div>
                                            <label className="gtm-field-label">Your display name</label>
                                            <input
                                                ref={inputRef}
                                                className="gtm-input"
                                                type="text"
                                                placeholder="e.g. Alex"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                maxLength={32}
                                                autoComplete="off"
                                            />
                                        </div>

                                        {error && (
                                            <div style={{ fontSize: "0.8rem", color: "#f87171", textAlign: "center" }}>
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="gtm-primary-btn"
                                            disabled={!displayName.trim() || isCreating}
                                        >
                                            {isCreating ? (
                                                <span className="gtm-loading">
                                                    <span className="gtm-spinner" />
                                                    Creating thread…
                                                </span>
                                            ) : (
                                                "Start Group Thread"
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── Step 2: Share invite link ── */}
                            {step === "link" && (
                                <>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                        <div className="gtm-success-icon">
                                            <Check size={22} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="gtm-step2-heading">Group thread created!</h3>
                                        <p className="gtm-step2-sub">
                                            Share this link so others can join your group thread.
                                        </p>
                                    </div>

                                    <div className="gtm-link-box">
                                        <span className="gtm-link-text">{inviteLink}</span>
                                        <button
                                            className={`gtm-copy-btn ${copied ? "gtm-copy-btn--copied" : ""}`}
                                            onClick={handleCopyLink}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check size={11} strokeWidth={3} />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={11} strokeWidth={2} />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <button className="gtm-primary-btn" onClick={handleEnterThread}>
                                        Enter Group Thread →
                                    </button>

                                    <button className="gtm-enter-btn" onClick={onClose}>
                                        Stay on this page
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
