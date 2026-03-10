"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Users, Send } from "lucide-react";
import { BRAND_NAME } from "@/config/constants";

const API_BASE =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? ""
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getWsBase = () => {
    if (typeof window === "undefined") return "";
    if (window.location.hostname !== "localhost") {
        // Production: derive WS origin from current page
        return window.location.origin.replace(/^http/, "ws");
    }
    return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws");
};

interface Member {
    id: string;
    name: string;
    is_creator: boolean;
    joined_at: number;
}

interface ChatMessage {
    id: string;
    type: "message" | "system";
    text: string;
    timestamp: number;
    sender_id?: string;
    sender_name?: string;
}

interface GroupData {
    token: string;
    creator_name: string;
    members: Member[];
    messages: ChatMessage[];
    thread_data: { query?: string; answer?: string };
}

function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function GroupPageContent({ token }: { token: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const memberId = searchParams.get("member_id") || "";

    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
    const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "error">("connecting");
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch initial group state
    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/group-threads/${token}`);
                if (res.status === 404) { setNotFound(true); return; }
                if (!res.ok) throw new Error("Failed to fetch");
                const data: GroupData = await res.json();
                setGroupData(data);
                setMessages(data.messages);
                setMembers(data.members);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [token]);

    // If no member_id, redirect to join page
    useEffect(() => {
        if (!loading && !memberId) {
            router.replace(`/join/${token}`);
        }
    }, [loading, memberId, token, router]);

    // Connect WebSocket
    useEffect(() => {
        if (!memberId || loading || notFound) return;

        const wsUrl = `${getWsBase()}/api/v1/group-threads/${token}/ws/${memberId}`;
        let ws: WebSocket;
        let pingInterval: ReturnType<typeof setInterval>;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            setWsStatus("connecting");
            ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setWsStatus("connected");
                // Add self to online set
                setOnlineIds((prev) => new Set([...prev, memberId]));
                // Keep-alive ping every 25s
                pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "ping" }));
                    }
                }, 25000);
            };

            ws.onmessage = (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    if (payload.event === "message") {
                        setMessages((prev) => [...prev, payload.message]);
                    } else if (payload.event === "system") {
                        setMessages((prev) => [...prev, payload.message]);
                    } else if (payload.event === "member_online") {
                        setOnlineIds((prev) => new Set([...prev, payload.member_id]));
                    } else if (payload.event === "member_offline") {
                        setOnlineIds((prev) => {
                            const next = new Set(prev);
                            next.delete(payload.member_id);
                            return next;
                        });
                    }
                } catch { /* ignore */ }
            };

            ws.onclose = () => {
                setWsStatus("error");
                clearInterval(pingInterval);
                // Auto-reconnect after 3s
                reconnectTimeout = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                setWsStatus("error");
            };
        };

        connect();

        return () => {
            ws?.close();
            clearInterval(pingInterval);
            clearTimeout(reconnectTimeout);
        };
    }, [memberId, token, loading, notFound]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(() => {
        const text = inputText.trim();
        if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: "message", text }));
        setInputText("");
        inputRef.current?.focus();
    }, [inputText]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    const myMember = members.find((m) => m.id === memberId);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
                <div className="gtm-spinner" style={{ width: 22, height: 22 }} />
            </div>
        );
    }

    if (notFound || !groupData) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: "0.95rem", color: "#888" }}>Group thread not found.</div>
                <button className="join-btn" style={{ maxWidth: 200 }} onClick={() => router.push("/")}>
                    Go home
                </button>
            </div>
        );
    }

    return (
        <div className="gp-page">
            {/* Header */}
            <div className="gp-header">
                <div className="gp-header-left">
                    <div className="gp-header-icon">
                        <Users size={16} strokeWidth={2} />
                    </div>
                    <div className="gp-header-info">
                        <h1>Group Thread</h1>
                        <p>
                            {BRAND_NAME} · {members.length} {members.length === 1 ? "member" : "members"}
                        </p>
                    </div>
                </div>

                <div className="gp-header-members">
                    <div className="gp-member-avatars">
                        {members.slice(0, 4).map((m) => (
                            <div key={m.id} className="gp-avatar" title={m.name}>
                                {m.name.slice(0, 1).toUpperCase()}
                                {onlineIds.has(m.id) && <span className="gp-online-dot" />}
                            </div>
                        ))}
                        {members.length > 4 && (
                            <div className="gp-avatar" title={`+${members.length - 4} more`}>
                                +{members.length - 4}
                            </div>
                        )}
                    </div>
                    <span className="gp-member-count">
                        {onlineIds.size} online
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="gp-body">
                {/* Thread context panel */}
                <div className="gp-thread-panel">
                    <div className="gp-thread-label">Thread Context</div>
                    {groupData.thread_data?.query ? (
                        <>
                            <div className="gp-thread-query">{groupData.thread_data.query}</div>
                            {groupData.thread_data.answer && (
                                <div className="gp-thread-answer">
                                    {groupData.thread_data.answer}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="gp-no-thread">No thread context attached.</div>
                    )}
                </div>

                {/* Chat panel */}
                <div className="gp-chat-panel">
                    <div className="gp-chat-label">
                        Live Discussion · {myMember ? myMember.name : ""}
                    </div>

                    {/* WS status bar */}
                    <div className="gp-ws-status">
                        <span className={`gp-ws-dot gp-ws-dot--${wsStatus}`} />
                        {wsStatus === "connected" && "Connected"}
                        {wsStatus === "connecting" && "Connecting…"}
                        {wsStatus === "error" && "Reconnecting…"}
                    </div>

                    {/* Messages */}
                    <div className="gp-messages">
                        {messages.map((msg) => {
                            if (msg.type === "system") {
                                return (
                                    <div key={msg.id} className="gp-msg-system">
                                        {msg.text}
                                    </div>
                                );
                            }

                            const isOwn = msg.sender_id === memberId;
                            return (
                                <div
                                    key={msg.id}
                                    className={`gp-msg ${isOwn ? "gp-msg--own" : "gp-msg--other"}`}
                                >
                                    {!isOwn && (
                                        <div className="gp-msg-name">{msg.sender_name}</div>
                                    )}
                                    <div className="gp-msg-bubble">{msg.text}</div>
                                    <div className="gp-msg-time">{formatTime(msg.timestamp)}</div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="gp-chat-input-wrap">
                        <textarea
                            ref={inputRef}
                            className="gp-chat-input"
                            placeholder="Message the group…"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={wsStatus !== "connected"}
                        />
                        <button
                            className="gp-send-btn"
                            onClick={sendMessage}
                            disabled={!inputText.trim() || wsStatus !== "connected"}
                            aria-label="Send"
                        >
                            <Send size={15} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GroupPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
                <div className="gtm-spinner" style={{ width: 22, height: 22 }} />
            </div>
        }>
            <GroupPageContent token={token} />
        </Suspense>
    );
}
