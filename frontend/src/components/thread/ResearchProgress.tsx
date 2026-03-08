"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { ResearchStep, SearchSource } from '@/hooks/useSearch';
import { Favicon } from '@/components/common';
import '../../styles/research.css';

interface ResearchProgressProps {
    query?: string;
    steps: ResearchStep[];
    isComplete: boolean;
    isStreaming?: boolean;
    isAnswerStarted?: boolean;
    sources?: SearchSource[];
    thoughtTime?: number;
}

export const ResearchProgress: React.FC<ResearchProgressProps> = ({
    query = "",
    steps,
    isComplete,
    isStreaming = false,
    isAnswerStarted = false,
    sources = [],
    thoughtTime = 0
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasAutoCollapsed = useRef(false);

    // Timer logic for "Thought for X.Xs"
    const [localTime, setLocalTime] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-collapse when answer content starts appearing
    useEffect(() => {
        if (isAnswerStarted && !hasAutoCollapsed.current) {
            setIsExpanded(false);
            hasAutoCollapsed.current = true;
        }
    }, [isAnswerStarted]);

    // Timer effect - High Precision Wall Clock Tracking
    useEffect(() => {
        if (!isStreaming && steps.length === 0) {
            setLocalTime(0);
            startTimeRef.current = null;
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        if (thoughtTime > 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setLocalTime(thoughtTime);
            return;
        }

        if (isStreaming && !isAnswerStarted) {
            if (!startTimeRef.current || steps.length === 1) {
                if (steps.length === 1 && startTimeRef.current) {
                    startTimeRef.current = Date.now();
                } else if (!startTimeRef.current) {
                    startTimeRef.current = Date.now();
                }

                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    if (startTimeRef.current) {
                        setLocalTime((Date.now() - startTimeRef.current) / 1000);
                    }
                }, 50);
            }
        }

        if (isAnswerStarted) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (startTimeRef.current && thoughtTime === 0) {
                setLocalTime((Date.now() - startTimeRef.current) / 1000);
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAnswerStarted, isStreaming, steps.length, thoughtTime]);

    // Reset auto-collapse tracker for new queries
    useEffect(() => {
        if (steps.length === 0) {
            hasAutoCollapsed.current = false;
            setIsExpanded(true);
        }
    }, [steps.length]);

    if (steps.length === 0 && !isStreaming) return null;

    // --- Classify steps ---
    const querySteps = steps.filter(s => s.type === 'query_step');
    const statusSteps = steps.filter(s => s.type === 'status');
    const thoughtSteps = steps.filter(s => s.type === 'thought');
    const latestThought = thoughtSteps.length > 0 ? thoughtSteps[thoughtSteps.length - 1] : null;
    const lastStatus = statusSteps.length > 0 ? statusSteps[statusSteps.length - 1] : null;

    // --- Header text logic (Perplexity style) ---
    const displayTime = thoughtTime > 0 ? thoughtTime : localTime;
    let headerText = 'Thinking...';

    if (isAnswerStarted || isComplete) {
        headerText = displayTime > 0
            ? `Thought for ${displayTime.toFixed(1)}s`
            : 'Research complete';
    } else if (latestThought || querySteps.length > 0 || isStreaming) {
        headerText = 'Thinking';
    }

    const hasSources = sources.length > 0;
    const isThinking = !isAnswerStarted && !isComplete;

    return (
        <div className="research-container">
            {/* ───────── HEADER: Green dot + "Thinking" / "Thought for X.Xs" ───────── */}
            <div
                className="thinking-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="thinking-dot-container">
                    <div className={`thinking-dot ${isComplete || isAnswerStarted ? 'complete' : ''}`} />
                    {isThinking && <div className="thinking-dot-pulse" />}
                </div>
                <span className="thinking-text">{headerText}</span>
                <ChevronDown
                    size={14}
                    className={`thinking-chevron ${isExpanded ? 'expanded' : ''}`}
                />
            </div>

            {/* ───────── EXPANDABLE CONTENT ───────── */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="research-content">

                            {/* ── Intent (Thought line) ── */}
                            {(latestThought || (isStreaming && steps.length === 0)) && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="rp-thought-line"
                                >
                                    <div className="rp-thought-dot" />
                                    <span>{latestThought?.content || "Analyzing your query..."}</span>
                                </motion.div>
                            )}

                            {/* ── Searching Phase — query pills ── */}
                            {querySteps.length > 0 && (
                                <div className="research-section">
                                    <div className="research-label">Searching</div>
                                    <div className="rp-search-queries">
                                        {querySteps.map((step, index) => (
                                            <motion.div
                                                key={`query-${index}`}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 30,
                                                    delay: index * 0.06
                                                }}
                                                className="rp-search-pill"
                                            >
                                                <Search size={12} className="rp-search-pill-icon" />
                                                <span>{step.content}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Reviewing Sources — Perplexity-style vertical list ── */}
                            {hasSources && (
                                <div className="research-section">
                                    <div className="research-label rp-reviewing-label">
                                        {isThinking && (
                                            <Loader2 size={11} className="animate-spin rp-reviewing-spinner" />
                                        )}
                                        Reviewing sources
                                    </div>
                                    <div className="rp-sources-list">
                                        {sources.map((source, index) => (
                                            <motion.a
                                                key={`rsrc-${index}`}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.04, duration: 0.25 }}
                                                className="rp-source-row"
                                            >
                                                <div className="rp-source-favicon">
                                                    <Favicon url={source.url} domain={source.domain || ''} size={18} />
                                                </div>
                                                <span className="rp-source-title">{source.title}</span>
                                                <span className="rp-source-domain">{source.domain?.replace(/^www\./, '')}</span>
                                            </motion.a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Active status line ── */}
                            {lastStatus && isThinking && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="status-line"
                                >
                                    <Loader2 size={13} className="animate-spin status-spinner" />
                                    <span>{lastStatus.content}</span>
                                </motion.div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
