"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useCallback } from "react";
import { useSearch } from "@/hooks/useSearch";
import AnswerStream from "@/components/thread/AnswerStream";
import AnswerSkeleton from "@/components/thread/AnswerSkeleton";
import ImagesGrid from "@/components/thread/ImagesGrid";

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";
    const focusMode = searchParams.get("focus") || "all";
    const threadId = searchParams.get("id") || undefined;
    const [followUp, setFollowUp] = useState("");
    const [activeTab, setActiveTab] = useState<"answer" | "links" | "images">("answer");
    const [sourcesPanelOpen, setSourcesPanelOpen] = useState(true);
    const [copied, setCopied] = useState(false);

    const {
        history,
        query: currentQuery,
        answer,
        sources,
        images,
        relatedQuestions,
        isStreaming,
        isConnecting,
        error,
        model,
        appendQuery
    } = useSearch(query, focusMode, threadId);

    const handleFollowUp = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const queryText = followUp.trim();
        if (!queryText || isConnecting || isStreaming) return;
        setFollowUp("");
        appendQuery(queryText);
    }, [followUp, appendQuery, isConnecting, isStreaming]);

    const handleRelatedSelect = useCallback((q: string) => {
        appendQuery(q);
    }, [appendQuery]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(answer);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [answer]);

    const isLoading = isConnecting && !answer && !error;
    const hasSources = sources.length > 0;

    return (
        <div className="sp-page">
            <div className={`sp-layout ${sourcesPanelOpen ? "sp-layout--panel-open" : ""}`}>

                {/* ─── Main Column ─── */}
                <div className="sp-main">

                    {/* Tab Bar */}
                    <div className="sp-tabbar">
                        <div className="sp-tabs" role="tablist" aria-label="Search views">
                            <button
                                role="tab"
                                aria-selected={activeTab === "answer"}
                                aria-controls="panel-answer"
                                className={`sp-tab ${activeTab === "answer" ? "sp-tab--active" : ""}`}
                                onClick={() => setActiveTab("answer")}
                                id="tab-answer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                Answer
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === "links"}
                                aria-controls="panel-links"
                                className={`sp-tab ${activeTab === "links" ? "sp-tab--active" : ""}`}
                                onClick={() => setActiveTab("links")}
                                id="tab-links"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                Links
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === "images"}
                                aria-controls="panel-images"
                                className={`sp-tab ${activeTab === "images" ? "sp-tab--active" : ""}`}
                                onClick={() => setActiveTab("images")}
                                id="tab-images"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                Images
                            </button>
                        </div>
                        <div className="sp-tabbar-right">
                            <button className="sp-more-btn" aria-label="More options">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                            </button>
                            <button className="sp-share-btn" aria-label="Share">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="sp-content">
                        <div className="sp-content-inner">


                            {/* === ANSWER TAB === */}
                            {activeTab === "answer" && (
                                <>
                                    {/* History map */}
                                    {history && history.map((turn, idx) => (
                                        <div key={idx} className="sp-thread-turn">
                                            <div className="sp-query-row">
                                                <div className="sp-query-bubble">{turn.query}</div>
                                            </div>
                                            <div className="sp-answer-body">
                                                <AnswerStream
                                                    content={turn.answer}
                                                    isStreaming={false}
                                                    sources={turn.sources}
                                                    onCopy={() => {
                                                        navigator.clipboard.writeText(turn.answer);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Current Turn Query */}
                                    <div className="sp-query-row">
                                        <div className="sp-query-bubble">{currentQuery}</div>
                                    </div>

                                    {isLoading && <AnswerSkeleton />}

                                    {error && !isLoading && (
                                        <div className="sp-error">
                                            <div className="sp-error-icon">⚡</div>
                                            <h2 className="sp-error-title">{error.includes("fetch") ? "Backend not connected" : "Search Error"}</h2>
                                            <p className="sp-error-msg">
                                                {error.includes("fetch")
                                                    ? <>Start the backend at <code>http://localhost:8000</code> to see live AI answers.</>
                                                    : error
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {(answer || isStreaming) && (
                                        <div className="sp-answer-body">
                                            <AnswerStream
                                                content={answer}
                                                isStreaming={isStreaming}
                                                sources={sources}
                                                onCopy={handleCopy}
                                            />
                                        </div>
                                    )}

                                    {/* Action row */}
                                    {(answer || hasSources) && (
                                        <div className="sp-action-row">
                                            <div className="sp-action-left">
                                                <button className="sp-icon-btn" onClick={handleCopy} title={copied ? "Copied!" : "Copy"}>
                                                    {copied ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
                                                    )}
                                                </button>
                                                <button className="sp-icon-btn" title="Download">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                                </button>
                                                <button className="sp-icon-btn" title="Copy text">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                </button>
                                                <button className="sp-icon-btn" title="Reload">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /></svg>
                                                </button>
                                                {/* Sources badge pill — Integrated with sourcesPanelOpen state */}
                                                <button
                                                    className={`sp-sources-badge ${!hasSources ? "sp-sources-badge--hidden" : ""} ${sourcesPanelOpen ? "sp-sources-badge--active" : ""}`}
                                                    onClick={() => setSourcesPanelOpen(!sourcesPanelOpen)}
                                                    id="sources-toggle-btn"
                                                    aria-expanded={sourcesPanelOpen}
                                                    aria-controls="sources-panel"
                                                    aria-label="View all sources"
                                                >
                                                    <div className="sp-sources-badge-icons">
                                                        {sources.slice(0, 3).map((src, i) => (
                                                            <div key={i} className="sp-sources-badge-icon-wrapper" style={{ zIndex: 3 - i }}>
                                                                {src.faviconUrl || src.domain ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={src.faviconUrl || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=128`} alt="" width={16} height={16} />
                                                                ) : (
                                                                    <div className="sp-sources-badge-icon-letter">{(src.domain[0] || "?").toUpperCase()}</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="sp-sources-badge-text">{sources.length} sources</span>
                                                </button>
                                            </div>
                                            <div className="sp-action-right">
                                                <button className="sp-icon-btn" title="Thumbs up">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                                                </button>
                                                <button className="sp-icon-btn" title="Thumbs down">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                                                </button>
                                                <button className="sp-icon-btn" title="More">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Follow-ups */}
                                    {!isStreaming && relatedQuestions.length > 0 && (
                                        <div className="sp-followups">
                                            <div className="sp-followups-title">Follow-ups</div>
                                            <div className="sp-followups-list">
                                                {relatedQuestions.map((q, i) => (
                                                    <button
                                                        key={i}
                                                        className="sp-followup-item"
                                                        onClick={() => handleRelatedSelect(q)}
                                                        id={`followup-${i}`}
                                                    >
                                                        <span className="sp-followup-arrow">↳</span>
                                                        <span className="sp-followup-text">{q}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* === LINKS TAB === */}
                            {activeTab === "links" && (
                                <div className="sp-links-tab">
                                    {sources.length === 0 ? (
                                        <div className="sp-empty-tab">Links will appear here when the backend is connected.</div>
                                    ) : (
                                        <div className="sp-links-list">
                                            {sources.map((src, i) => (
                                                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="sp-link-item">
                                                    <div className="sp-link-favicon">
                                                        {src.faviconUrl || src.domain ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={src.faviconUrl || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=128`} alt="" width={16} height={16} />
                                                        ) : (
                                                            <div className="sp-link-icon-letter">{(src.domain[0] || "?").toUpperCase()}</div>
                                                        )}
                                                    </div>
                                                    <div className="sp-link-content">
                                                        <div className="sp-link-domain">{src.domain}</div>
                                                        <div className="sp-link-title">{src.title}</div>
                                                        {src.snippet && <div className="sp-link-snippet">{src.snippet}</div>}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* === IMAGES TAB === */}
                            {activeTab === "images" && (
                                <div className="sp-images-tab">
                                    {images.length === 0 ? (
                                        <div className="sp-images-empty-container">
                                            <div className="sp-empty-tab sp-empty-images-msg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                                <p>Images will appear here when the backend is connected.</p>
                                            </div>
                                            <div className="sp-images-skeleton-grid">
                                                <div className="sp-skeleton-image-box"></div>
                                                <div className="sp-skeleton-image-box"></div>
                                                <div className="sp-skeleton-image-box"></div>
                                                <div className="sp-skeleton-image-box"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ImagesGrid images={images} />
                                    )}
                                </div>
                            )}
                        </div>{/* end sp-content-inner */}
                    </div>

                    {/* Sticky Input Bar — at bottom of main column */}
                    {activeTab === "answer" && (
                        <div className="sp-input-bar">
                            <form className="sp-input-form" onSubmit={handleFollowUp}>
                                <button type="button" className="sp-input-attach" aria-label="Attach">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                </button>
                                <input
                                    type="text"
                                    className="sp-input-field"
                                    placeholder="Ask a follow-up"
                                    value={followUp}
                                    onChange={e => setFollowUp(e.target.value)}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    id="follow-up-input"
                                />
                                <div className="sp-input-actions">
                                    <button type="button" className="sp-model-btn" aria-label="Select model">
                                        Model <span className="sp-model-arrow">▾</span>
                                    </button>
                                    <button type="button" className="sp-voice-btn" aria-label="Voice input">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                    </button>
                                    <button type="submit" className="sp-submit-btn" disabled={!followUp.trim() || isConnecting || isStreaming} aria-label="Send">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* ─── Right Sources Panel — Always rendered to allow smooth CSS transitions ─── */}
                <aside className="sp-sources-panel" id="sources-panel">
                    <div className="sp-sources-panel-header">
                        <div>
                            <h3 className="sp-sources-panel-title">
                                {hasSources ? (sources.length >= 5 ? `${sources.length} sources` : "Sources") : "Sources"}
                            </h3>
                        </div>
                        <button
                            className="sp-sources-panel-close"
                            onClick={() => setSourcesPanelOpen(false)}
                            aria-label="Close sources panel"
                        >✕</button>
                    </div>

                    {hasSources ? (
                        <div className="sp-sources-panel-list">
                            {sources.map((src, i) => (
                                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="sp-source-item" id={`source-item-${i + 1}`}>
                                    <div className="sp-source-item-icon">
                                        {src.faviconUrl || src.domain ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={src.faviconUrl || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=128`} alt="" width={24} height={24} style={{ borderRadius: "50%" }}
                                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        ) : (
                                            <div className="sp-source-item-letter">{(src.domain[0] || "?").toUpperCase()}</div>
                                        )}
                                    </div>
                                    <div className="sp-source-item-body">
                                        <div className="sp-source-item-domain-row">
                                            <div className="sp-source-item-domain">{src.domain}</div>
                                        </div>
                                        <div className="sp-source-item-title">{src.title}</div>
                                        {src.snippet && <div className="sp-source-item-snippet">{src.snippet}</div>}
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="sp-sources-empty">
                            {isLoading ? "Finding top sources..." : "No sources available. Start the backend to see sources."}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function SearchPageSkeleton() {
    return (
        <div className="sp-page">
            <div className="sp-layout sp-layout--panel-open">
                <div className="sp-main">
                    <div className="sp-tabbar">
                        <div className="sp-tabs">
                            <button className="sp-tab sp-tab--active" disabled>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                Answer
                            </button>
                            <button className="sp-tab" disabled>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                Links
                            </button>
                            <button className="sp-tab" disabled>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                Images
                            </button>
                        </div>
                    </div>
                    <div className="sp-content">
                        <div className="sp-query-row" style={{ opacity: 0 }}>
                            <div className="sp-query-bubble">Loading...</div>
                        </div>
                        <AnswerSkeleton />
                    </div>
                    <div className="sp-input-bar">
                        <form className="sp-input-form" style={{ opacity: 0.5, pointerEvents: "none" }}>
                            <button type="button" className="sp-input-attach">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                            <input type="text" className="sp-input-field" disabled placeholder="Ask a follow-up" />
                            <div className="sp-input-actions">
                                <button type="button" className="sp-model-btn">Model ▾</button>
                            </div>
                        </form>
                    </div>
                </div>
                <aside className="sp-sources-panel">
                    <div className="sp-sources-panel-header">
                        <div>
                            <h3 className="sp-sources-panel-title">Sources</h3>
                            <p className="sp-sources-panel-subtitle">Loading...</p>
                        </div>
                    </div>
                    <div className="sp-sources-empty">Finding top sources...</div>
                </aside>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageSkeleton />}>
            <SearchPageContent />
        </Suspense>
    );
}
