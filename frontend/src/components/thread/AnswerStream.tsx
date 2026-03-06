"use client";
import { useRef, useEffect, memo, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SearchSource, ResearchStep } from "@/hooks/useSearch";
import { ResearchProgress } from "./ResearchProgress";

interface AnswerStreamProps {
    query?: string;
    content: string;
    isStreaming: boolean;
    sources: SearchSource[];
    researchSteps?: ResearchStep[];
    thoughtTime?: number;
    onCopy?: () => void;
    sourcesPanelOpen?: boolean;
    setSourcesPanelOpen?: (open: boolean) => void;
}

const AnswerStream = memo(({
    query = "",
    content,
    isStreaming,
    sources,
    researchSteps = [],
    thoughtTime = 0,
    onCopy,
    sourcesPanelOpen: externalSourcesPanelOpen,
    setSourcesPanelOpen: externalSetSourcesPanelOpen
}: AnswerStreamProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [localCopied, setLocalCopied] = useState(false);
    const [localSourcesPanelOpen, setLocalSourcesPanelOpen] = useState(false);

    // Use external state if provided (for page-level control), otherwise use local state
    const sourcesPanelOpen = externalSourcesPanelOpen !== undefined ? externalSourcesPanelOpen : localSourcesPanelOpen;
    const setSourcesPanelOpen = externalSetSourcesPanelOpen !== undefined ? externalSetSourcesPanelOpen : setLocalSourcesPanelOpen;

    // Convert generic [1] citations into markdown links [1](1)
    let processedContent = content.replace(/\[(\d+)\]/g, '[$1]($1)');

    // Scrubber: Remove any trailing "References:", "Sources:", etc that the LLM might hallucinate
    // This handles various styles: "References:", "Sources:", "Bibliography:", etc.
    const bibPatterns = [
        /(?:\n|^)\s*(?:References|Sources|Bibliography|Sources Used):\s*(?:\n|$)/i,
        /(?:\n|^)\s*#+\s*(?:Sources|References|Bibliography)\s*(?:\n|$)/i,
        /\n\s*1\.\s+[A-Z][a-z]+,.*?\(\d{4}\)/, // Catch standard APA style bibliographies
        /\n\s*\[1\]\s+http/ // Catch numbered URL lists
    ];

    for (const pattern of bibPatterns) {
        const matchIndex = processedContent.search(pattern);
        if (matchIndex !== -1) {
            // Cut off everything from the start of the match to the end of the content
            console.log(`[AnswerStream] NUCLEAR SCRUB: Found bibliography pattern at index ${matchIndex}. Cutting response.`);
            processedContent = processedContent.substring(0, matchIndex).trim();
            break;
        }
    }

    // Defensive log for sources - lets us see if the prop is actually arriving
    if (isStreaming && content.length > 50 && content.length < 100) {
        console.log(`[AnswerStream] Stream state check: sources=${sources.length}, isStreaming=${isStreaming}`);
    }

    // Auto-scroll: track the cursor so the text generation stays in view without forcing a full bottom scroll
    useEffect(() => {
        if (!isStreaming) return;

        const scrollable = document.querySelector('.sp-content');
        if (!scrollable) return;

        const cursor = scrollable.querySelector('.answer-cursor');
        if (cursor) {
            const cursorRect = cursor.getBoundingClientRect();
            const scrollableRect = scrollable.getBoundingClientRect();

            // If the streaming cursor hits the bottom of the visible area, push the scroll down gently
            if (cursorRect.bottom > scrollableRect.bottom - 40) {
                // We only push down by the exact amount needed to keep the cursor visible
                scrollable.scrollBy({ top: cursorRect.bottom - scrollableRect.bottom + 40, behavior: "smooth" });
            }
        }
    }, [content, isStreaming]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setLocalCopied(true);
        setTimeout(() => setLocalCopied(false), 2000);
        onCopy?.();
    };

    // Memoize markdown components so they aren't recreated on every render
    const markdownComponents = useMemo(() => {
        const lineClass = isStreaming ? " liquid-line" : "";
        return {
            p: ({ children }: any) => (
                <p className={`answer-paragraph${lineClass}`}>{children}</p>
            ),
            h2: ({ children }: any) => (
                <h2 className={`answer-h2${lineClass}`}>{children}</h2>
            ),
            h3: ({ children }: any) => (
                <h3 className={`answer-h3${lineClass}`}>{children}</h3>
            ),
            ul: ({ children }: any) => (
                <ul className="answer-list">{children}</ul>
            ),
            ol: ({ children }: any) => (
                <ol className="answer-list answer-list-ordered">{children}</ol>
            ),
            li: ({ children }: any) => (
                <li className={`answer-list-item${lineClass}`}>{children}</li>
            ),
            code: ({ children, className }: any) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                    return (
                        <pre className={`answer-code-block${lineClass}`}>
                            <code>{children}</code>
                        </pre>
                    );
                }
                return <code className="answer-code-inline">{children}</code>;
            },
            strong: ({ children }: any) => (
                <strong className="answer-bold">{children}</strong>
            ),
            a: ({ href, children }: any) => {
                if (href && !isNaN(Number(href))) {
                    const index = parseInt(href, 10);
                    const realSource = sources[index - 1];
                    return (
                        <a
                            href={realSource?.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="answer-inline-citation"
                            title={realSource?.title || "Source"}
                            data-index={index}
                        >
                            {index}
                        </a>
                    );
                }
                return <a href={href} className="answer-link" target="_blank" rel="noopener noreferrer">{children}</a>;
            },
        };
    }, [sources, isStreaming]);

    return (
        <div className="answer-stream" id="answer-stream" ref={contentRef}>
            {/* Research Progress / Thinking State */}
            <ResearchProgress
                query={query}
                steps={researchSteps}
                isComplete={!isStreaming && content.length > 0}
                isStreaming={isStreaming}
                isAnswerStarted={content.length > 0}
                sources={sources}
                thoughtTime={thoughtTime}
            />

            {/* Answer section — clean render, no layout animations during streaming */}
            {content.trim().length > 0 && (
                <div className="answer-container-wrapper">
                    {/* Answer header bar */}
                    <div className="answer-stream-header">
                        <div className="answer-stream-label">
                            <div className={isStreaming ? "answer-icon-pulse" : ""}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                            <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>Answer</span>
                            {isStreaming && <span className="answer-streaming-dot" />}
                        </div>
                        <div className="answer-stream-actions">
                            <button
                                className="answer-action-btn"
                                onClick={handleCopy}
                                title="Copy answer"
                                aria-label="Copy answer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                            </button>
                            <button
                                className="answer-action-btn"
                                title="Share"
                                aria-label="Share answer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Answer content — pure CSS transitions, no Framer Motion layout thrashing */}
                    <div className="answer-stream-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {processedContent}
                        </ReactMarkdown>

                        {/* Streaming cursor */}
                        {isStreaming && (
                            <span className="answer-cursor" aria-hidden="true">▋</span>
                        )}
                    </div>

                    {/* Action row — Scoped per-message, delayed while streaming */}
                    {(content.trim().length > 0 || sources.length > 0) && !isStreaming && (
                        <div className="sp-action-row">
                            <div className="sp-action-left">
                                <button className="sp-icon-btn" onClick={handleCopy} title={localCopied ? "Copied!" : "Copy"}>
                                    {localCopied ? (
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
                                {/* Sources action button */}
                                {sources.length > 0 && (
                                    <button
                                        className={`sp-sources-action-btn ${sourcesPanelOpen ? "active" : ""}`}
                                        onClick={() => setSourcesPanelOpen(!sourcesPanelOpen)}
                                        aria-label="View sources"
                                    >
                                        <div className="sp-sources-pill-favicons">
                                            {sources.slice(0, 3).map((source, i) => (
                                                <div
                                                    key={i}
                                                    className="sp-source-pill-icon"
                                                    style={{ zIndex: 3 - i }}
                                                >
                                                    {source.favicon ? (
                                                        <img src={source.favicon} alt="" />
                                                    ) : (
                                                        <span className="sp-source-pill-letter">
                                                            {(source.domain || source.url || "?").charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="sp-sources-pill-text">
                                            {sources.length} sources
                                        </span>
                                    </button>
                                )}
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
                </div>
            )}
        </div>
    );
});

AnswerStream.displayName = "AnswerStream";
export default AnswerStream;
