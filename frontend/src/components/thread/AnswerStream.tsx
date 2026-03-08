"use client";
import { useRef, useEffect, memo, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SearchSource, ResearchStep } from "@/hooks/useSearch";
import { ResearchProgress } from "./ResearchProgress";

// Premium Formatting Dependencies
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Syntax Highlighting
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CornerDownRight } from "lucide-react";

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
    relatedQuestions?: string[];
    onRelatedSelect?: (question: string) => void;
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
    setSourcesPanelOpen: externalSetSourcesPanelOpen,
    relatedQuestions = [],
    onRelatedSelect
}: AnswerStreamProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [localCopied, setLocalCopied] = useState(false);
    const [localSourcesPanelOpen, setLocalSourcesPanelOpen] = useState(false);

    // Use external state if provided (for page-level control), otherwise use local state
    const sourcesPanelOpen = externalSourcesPanelOpen !== undefined ? externalSourcesPanelOpen : localSourcesPanelOpen;
    const setSourcesPanelOpen = externalSetSourcesPanelOpen !== undefined ? externalSetSourcesPanelOpen : setLocalSourcesPanelOpen;

    // 1. Group adjacent citations: [1][2][3] -> [1,2,3](citation:1,2,3)
    let processedContent = content;

    // Normalize any escaped brackets: \[1\] -> [1]
    processedContent = processedContent.replace(/\\\[(\d+)\\\]/g, '[$1]');

    // Normalize AI hallucinations: **1** -> [1], ^1^ -> [1], [ 1 ] -> [1]
    processedContent = processedContent.replace(/\*\*(\d+)\*\*/g, '[$1]');
    processedContent = processedContent.replace(/\^(\d+)\^/g, '[$1]');
    processedContent = processedContent.replace(/\[\s*(\d+)\s*\]/g, '[$1]');

    // Normalize plain numbers hallucinated at the end of sentences (e.g., "word 1. ")
    processedContent = processedContent.replace(/([a-zA-Z])\s+(\d+)([\.,])(?=\s|$)/g, (match, letter, num, punc) => {
        const sourceIdx = parseInt(num, 10);
        if (sourceIdx >= 1 && sourceIdx <= sources.length) {
            return `${letter} [${num}]${punc}`;
        }
        return match; // Ignore if it's not a valid source range (avoids false positives like "Top 5.")
    });

    // Normalize comma-separated citations: [1, 2, 3] -> [1][2][3]
    processedContent = processedContent.replace(/\[([0-9,\s]+)\]/g, (match, inner) => {
        const nums = inner.split(',').map((n: string) => n.trim()).filter((n: string) => n);
        return nums.map((n: string) => `[${n}]`).join('');
    });

    // Group adjacent citations (even if there are spaces between them), but ONLY if they aren't already part of a markdown link
    processedContent = processedContent.replace(/((?:\[\d+\]\s*)+)(?!\()/g, (match) => {
        const indices = match.match(/\d+/g)?.join(',') || "";
        return `[${indices}](citation:${indices})`;
    });

    // 2. Nuclear Scrubber: Remove any trailing "References:", "Sources:", etc that the LLM might hallucinate
    // This is aggressive because the UI already has a dedicated sources panel.
    const bibPatterns = [
        /(?:\n|^)\s*(?:#+\s*)?(?:References?|Sources?|Bibliography|Sources Used):?\s*(?:\n|$)/i,
        /\n\s*1\.\s+[A-Z][a-z]+,.*?\(\d{4}\)/, // Catch standard APA style bibliographies
        /\n\s*(?:\[1\]|1\.)\s+http/, // Catch numbered URL lists
        /\n\s*1,\s*2,\s*3/, // Catch raw csv-style lists at bottom
        /(?:\n|^)(?:\[[^\]]+\]\(https?:\/\/[^\s\)]+\)\s*){2,}/ // Aggressive: 2+ links in a row = list
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
            code: ({ children, className, node }: any) => {
                const isBlock = className?.includes("language-");
                const language = className ? className.replace("language-", "") : "";

                if (isBlock) {
                    const [copied, setCopied] = useState(false);
                    const codeString = String(children).replace(/\n$/, "");

                    const copyCode = () => {
                        navigator.clipboard.writeText(codeString);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    };

                    const isTerminal = ["bash", "sh", "zsh", "shell", "terminal"].includes(language.toLowerCase());
                    const containerClass = isTerminal ? "answer-code-block-terminal" : "answer-code-block";

                    return (
                        <div className={`answer-code-container ${lineClass}`}>
                            <div className="answer-code-header">
                                <span className="answer-code-lang">{language || "code"}</span>
                                <button className="answer-copy-code-btn" onClick={copyCode}>
                                    {copied ? (
                                        <div className="answer-copy-code-success">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            <span>Copied</span>
                                        </div>
                                    ) : (
                                        <div className="answer-copy-code-default">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                            </svg>
                                            <span>Copy</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                            <SyntaxHighlighter
                                language={language || "text"}
                                style={oneDark}
                                customStyle={{
                                    margin: 0,
                                    padding: '16px',
                                    background: 'transparent',
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6',
                                    borderRadius: '0 0 12px 12px',
                                }}
                                wrapLongLines={true}
                                PreTag="div"
                            >
                                {codeString}
                            </SyntaxHighlighter>
                        </div>
                    );
                }
                return <code className="answer-code-inline">{children}</code>;
            },
            strong: ({ children }: any) => (
                <strong className="answer-bold">{children}</strong>
            ),
            a: ({ href, children }: any) => {
                const decodedHref = href ? decodeURIComponent(href) : "";

                // 1. Is it using our internal citation scheme? (e.g., citation:1)
                const isExplicitCitationURL = decodedHref && (
                    decodedHref.trim().replace(/\s/g, '').startsWith("citation:") ||
                    decodedHref.trim().replace(/\s/g, '').includes("citation:") ||
                    decodedHref.trim().replace(/\s/g, '').startsWith("cite:") ||
                    decodedHref.trim().replace(/\s/g, '').includes("cite:")
                );

                let isMarkdownLinkCitation = false;
                let citationIndices: number[] = [];

                if (isExplicitCitationURL) {
                    const normalizedHref = decodedHref.trim().replace(/\s/g, '');
                    const parts = normalizedHref.split(normalizedHref.includes("citation:") ? "citation:" : "cite:");
                    const indicesStr = parts[parts.length - 1];
                    citationIndices = indicesStr.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                } else if (children) {
                    // 2. Intercept AI hallucinating real URLs but using numbers as the text (e.g., [1](https://...))
                    // We extract the text, strip brackets, and check if it's purely a number mapping to our sources.
                    const textContent = Array.isArray(children) ? children.join('') : String(children);
                    const cleanText = textContent.trim().replace(/[\[\]]/g, '');

                    if (/^[\d,\s]+$/.test(cleanText)) {
                        const nums = cleanText.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
                        if (nums.length > 0 && nums.every(n => n >= 1 && n <= sources.length)) {
                            isMarkdownLinkCitation = true;
                            citationIndices = nums;
                        }
                    }
                }

                // If it's any form of citation (explicit or hallucinated markdown link), render the Pillar!
                if (isExplicitCitationURL || isMarkdownLinkCitation) {
                    if (citationIndices.length === 0) return <span>{children}</span>;

                    const primaryIdx = citationIndices[0];
                    const primarySource = sources[primaryIdx - 1];
                    const extraCount = citationIndices.length - 1;

                    // If we have data for the source, show the professional pill
                    if (primarySource) {
                        return (
                            <a
                                href={primarySource.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="answer-source-pill"
                                title={primarySource.title || "View Source"}
                            >
                                <span className="source-pill-icon">
                                    {primarySource.favicon ? (
                                        <img src={primarySource.favicon} alt="" />
                                    ) : (
                                        <span className="source-pill-letter">
                                            {(primarySource.domain || "S").charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </span>
                                <span className="source-pill-name">
                                    {primarySource.domain || "source"}
                                </span>
                                {extraCount > 0 && (
                                    <span className="source-pill-extra">+{extraCount}</span>
                                )}
                            </a>
                        );
                    }

                    // Premium Fallback: Small glassmorphic number pill (Billion Dollar style)
                    return (
                        <a
                            href={decodedHref.startsWith('http') ? decodedHref : "#"}
                            className="answer-source-pill-mini"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View Source"
                        >
                            {primaryIdx}{extraCount > 0 ? `+${extraCount}` : ""}
                        </a>
                    );
                }

                // Standard text hyperlink
                return <a href={href} className="answer-link" target="_blank" rel="noopener noreferrer">{children}</a>;
            },
            table: ({ children }: any) => (
                <div className="answer-table-wrapper">
                    <table className="answer-table">{children}</table>
                </div>
            ),
            thead: ({ children }: any) => (
                <thead className="answer-thead">{children}</thead>
            ),
            tbody: ({ children }: any) => (
                <tbody className="answer-tbody">{children}</tbody>
            ),
            tr: ({ children }: any) => (
                <tr className="answer-tr">{children}</tr>
            ),
            th: ({ children }: any) => (
                <th className="answer-th">{children}</th>
            ),
            td: ({ children }: any) => (
                <td className="answer-td">{children}</td>
            ),
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
            {(content.trim().length > 0 || isStreaming) && (
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
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
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

                    {/* Follow-ups - Now beautifully constrained to the exact AnswerStream width */}
                    {!isStreaming && relatedQuestions.length > 0 && (
                        <div className="sp-followups">
                            <div className="sp-followups-title">Follow-ups</div>
                            <div className="sp-followups-list">
                                {relatedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        className="sp-followup-item"
                                        onClick={() => onRelatedSelect?.(q)}
                                        id={`followup-${i}`}
                                    >
                                        <span className="sp-followup-arrow">
                                            <CornerDownRight size={16} strokeWidth={2} />
                                        </span>
                                        <span className="sp-followup-text">{q}</span>
                                    </button>
                                ))}
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
