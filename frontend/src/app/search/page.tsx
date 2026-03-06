"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
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
    const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
    const [activePanelSources, setActivePanelSources] = useState<any[]>([]);
    const [activePanelQuery, setActivePanelQuery] = useState("");
    const [copied, setCopied] = useState(false);

    const {
        history,
        query: currentQuery,
        answer,
        sources,
        images,
        researchSteps,
        relatedQuestions,
        isStreaming,
        isConnecting,
        error,
        model,
        thoughtTime,
        appendQuery
    } = useSearch(query, focusMode, threadId);

    // --- EFFECT: When global sources update, update the active panel IF it was for the current query ---
    useEffect(() => {
        if (sources.length > 0 && !isStreaming) {
            // If the panel is open and showing the current query (or just opened), update it
            if (activePanelQuery === "" || activePanelQuery === currentQuery) {
                setActivePanelSources(sources);
                setActivePanelQuery(currentQuery);
            }
        }
    }, [sources, isStreaming, currentQuery, activePanelQuery]);

    const toggleSourcesPanel = (open: boolean, msgSources?: any[], msgQuery?: string) => {
        if (open) {
            if (msgSources && msgQuery) {
                setActivePanelSources(msgSources);
                setActivePanelQuery(msgQuery);
            } else {
                // Fallback to latest
                setActivePanelSources(sources);
                setActivePanelQuery(currentQuery);
            }
            setSourcesPanelOpen(true);
        } else {
            setSourcesPanelOpen(false);
        }
    };

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

    // Scroll to the new query when it becomes active
    useEffect(() => {
        if (currentQuery && (isConnecting || isStreaming)) {
            const queryRow = document.getElementById("current-query-row");
            const scrollable = document.querySelector(".sp-content");
            if (queryRow && scrollable) {
                // Wait slightly for the motion.div to mount and begin expanding
                setTimeout(() => {
                    if (history.length > 0) {
                        // For follow-ups: perfectly frame the new query at the top of the view
                        queryRow.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                        // For the first query: just ensure we're at the bottom so the initial animations look clean
                        scrollable.scrollTo({ top: scrollable.scrollHeight, behavior: "smooth" });
                    }
                }, 50);
            }
        }
    }, [currentQuery, isConnecting, isStreaming, history.length]);

    return (
        <div className="sp-page">
            <div className={`sp-layout ${sourcesPanelOpen ? "sp-layout--panel-open" : ""}`}>

                {/* ─── Main Column ─── */}
                <div className="sp-main">

                    {/* Tab Bar */}
                    <motion.div
                        className="sp-tabbar"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
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
                    </motion.div>

                    {/* Scrollable Content Area */}
                    <div className="sp-content">
                        <div className="sp-content-inner">


                            {/* === ANSWER TAB === */}
                            {activeTab === "answer" && (
                                <>
                                    {/* History — stable, no animations, no re-renders */}
                                    {history && history.map((turn, idx) => (
                                        <div key={`history-${idx}`} className="sp-thread-turn">
                                            <div className="sp-query-row">
                                                <div className="sp-query-bubble">{turn.query}</div>
                                            </div>
                                            <div className="sp-answer-body">
                                                <AnswerStream
                                                    query={turn.query}
                                                    content={turn.answer}
                                                    isStreaming={false}
                                                    sources={turn.sources}
                                                    researchSteps={turn.researchSteps}
                                                    thoughtTime={turn.thoughtTime}
                                                    onCopy={handleCopy}
                                                    sourcesPanelOpen={sourcesPanelOpen && activePanelQuery === turn.query}
                                                    setSourcesPanelOpen={(open) => toggleSourcesPanel(open, turn.sources, turn.query)}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Current Turn Query */}
                                    <motion.div
                                        className="sp-query-row"
                                        id="current-query-row"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
                                    >
                                        <div className="sp-query-bubble">{currentQuery}</div>
                                    </motion.div>

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

                                    {/* Current answer */}
                                    {(answer || isStreaming) && (
                                        <motion.div
                                            className="sp-answer-body"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                                        >
                                            <AnswerStream
                                                query={currentQuery}
                                                content={answer}
                                                isStreaming={isStreaming}
                                                sources={sources}
                                                researchSteps={researchSteps}
                                                thoughtTime={thoughtTime}
                                                onCopy={handleCopy}
                                                sourcesPanelOpen={sourcesPanelOpen && activePanelQuery === currentQuery}
                                                setSourcesPanelOpen={(open) => toggleSourcesPanel(open, sources, currentQuery)}
                                            />
                                        </motion.div>
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

                            {/* === LINKS TAB — Perplexity-style search results === */}
                            {activeTab === "links" && (
                                <div className="sp-links-tab">
                                    {sources.length === 0 ? (
                                        <div className="sp-empty-tab">
                                            {isLoading ? (
                                                <div className="sp-links-loading">
                                                    <div className="sp-links-loading-dot" />
                                                    <span>Searching the web...</span>
                                                </div>
                                            ) : error ? (
                                                <div className="sp-links-error">
                                                    <div className="sp-error-icon">⚠️</div>
                                                    <span>{error.includes("Tavily") ? "Web search limit reached (Tavily). Using internal knowledge." : error}</span>
                                                </div>
                                            ) : (
                                                "No links found for this query."
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="sp-links-header">
                                                Search results for: <strong>{currentQuery}</strong>
                                            </div>
                                            <div className="sp-links-list">
                                                {sources.map((src, i) => (
                                                    <a
                                                        key={i}
                                                        href={src.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="sp-link-item"
                                                        id={`link-result-${i}`}
                                                    >
                                                        <div className="sp-link-left">
                                                            {/* Favicon circle */}
                                                            <div className="sp-link-favicon">
                                                                <img
                                                                    src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${src.url}&size=64`}
                                                                    alt=""
                                                                    width={20}
                                                                    height={20}
                                                                    onError={(e) => {
                                                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                                        const parent = e.currentTarget.parentElement;
                                                                        if (parent) {
                                                                            parent.innerHTML = `<span class="sp-link-favicon-letter">${(src.domain || 'W')[0].toUpperCase()}</span>`;
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {/* Content block */}
                                                            <div className="sp-link-content">
                                                                <div className="sp-link-meta">
                                                                    <span className="sp-link-domain-name">{src.domain?.replace(/^www\./, '')}</span>
                                                                </div>
                                                                <div className="sp-link-url">{src.url}</div>
                                                                <div className="sp-link-title">{src.title}</div>
                                                                {src.snippet && <div className="sp-link-snippet">{src.snippet}</div>}
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </>
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
                                {activePanelSources.length > 0 ? `${activePanelSources.length} sources` : "Sources"}
                            </h3>
                            {activePanelSources.length > 0 && (
                                <p className="sp-sources-panel-subtitle">
                                    Sources for {activePanelQuery}
                                </p>
                            )}
                        </div>
                        <button
                            className="sp-sources-panel-close"
                            onClick={() => setSourcesPanelOpen(false)}
                            aria-label="Close sources panel"
                        >✕</button>
                    </div>

                    {activePanelSources.length > 0 ? (
                        <div className="sp-sources-panel-list">
                            {activePanelSources.map((src, i) => (
                                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="sp-source-item" id={`source-item-${i + 1}`}>
                                    <div className="sp-source-item-icon">
                                        <img
                                            src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${src.url}&size=64`}
                                            alt=""
                                            width={24}
                                            height={24}
                                            style={{ borderRadius: "50%" }}
                                            onError={(e) => {
                                                (e.currentTarget as any).style.display = 'none';
                                                (e.currentTarget as any).parentElement.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe opacity-40"><circle cx="12" cy="12" r="10"/><path d="M12 2h20"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/></svg>';
                                            }}
                                        />
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
