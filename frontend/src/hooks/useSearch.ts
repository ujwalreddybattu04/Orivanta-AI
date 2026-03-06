"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SearchSource {
    url: string;
    title: string;
    domain: string;
    favicon?: string;
    faviconUrl?: string;
    snippet?: string;
    citationIndex: number;
}

export interface SearchImage {
    url: string;
    alt: string;
    sourceUrl?: string;
}

export interface SearchMessage {
    query: string;
    answer: string;
    sources: SearchSource[];
    images: SearchImage[];
}

export interface ThreadData {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    query: string;
    history: SearchMessage[];
    answer: string;
    sources: SearchSource[];
    images: SearchImage[];
}

// Simple UUID generator for browser
function generateThreadId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface ResearchStep {
    type: 'thought' | 'query_step' | 'status';
    content: string;
}

export interface SearchState {
    threadId: string | null;
    history: SearchMessage[];
    query: string;
    answer: string;
    sources: SearchSource[];
    images: SearchImage[];
    researchSteps: ResearchStep[];
    relatedQuestions: string[];
    isStreaming: boolean;
    isConnecting: boolean;
    error: string | null;
    model: string;
    tokensUsed: number;
    thoughtTime: number; // Added to capture exact backend calculation
}

export function useSearch(initialQuery: string, focusMode: string = "all", existingThreadId?: string) {
    const [state, setState] = useState<SearchState>({
        threadId: existingThreadId || null,
        history: [],
        query: initialQuery,
        answer: "",
        sources: [],
        images: [],
        researchSteps: [],
        relatedQuestions: [],
        isStreaming: false,
        isConnecting: true,
        error: null,
        model: "Auto",
        tokensUsed: 0,
        thoughtTime: 0,
    });

    const abortRef = useRef<AbortController | null>(null);
    const hasStarted = useRef(false);
    const lastProcessedQuery = useRef<string | null>(null);
    const threadIdRef = useRef<string | null>(existingThreadId || null);

    const runSearch = useCallback(async (q: string, focus: string, backendMessages?: any[], keepHistory?: SearchMessage[]) => {
        if (!q.trim()) return;

        // Abort any in-flight request
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setState(prev => ({
            ...prev,
            history: keepHistory !== undefined ? keepHistory : prev.history,
            query: q,
            answer: "",
            sources: [],
            images: [],
            researchSteps: [],
            relatedQuestions: [],
            isStreaming: true,
            isConnecting: true,
            error: null,
        }));

        try {
            const response = await fetch(`${API_BASE}/api/v1/search/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: q, focus_mode: focus, messages: backendMessages || [] }),
                signal: abortRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status} ${response.statusText}`);
            }

            setState(prev => ({ ...prev, isConnecting: false }));

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                if (chunk.includes('"type": "sources"')) {
                    console.log("[useSearch] RAW SOURCE CHUNK DETECTED:", chunk);
                }
                buffer += chunk;
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === "data: [DONE]") continue;

                    // Support both "data: {...}" and "data:{...}"
                    if (!trimmed.startsWith("data:")) continue;

                    try {
                        const jsonPayload = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed.slice(5);
                        const json = JSON.parse(jsonPayload);

                        if (json.type === "token") {
                            setState(prev => ({ ...prev, answer: prev.answer + (json.content || "") }));
                        } else if (json.type === "sources") {
                            // Support multiple possible keys for robustness
                            const sourcesList = json.sources || json.items || json.results || [];
                            console.log(`[useSearch] SOURCES ARRIVED! Count: ${sourcesList.length}`);
                            if (sourcesList.length > 0) {
                                console.log("[useSearch] First source sample:", sourcesList[0]);
                            }
                            setState(prev => ({ ...prev, sources: sourcesList }));
                        } else if (json.type === "images") {
                            setState(prev => ({ ...prev, images: json.images || [] }));
                        } else if (json.type === "related") {
                            setState(prev => ({ ...prev, relatedQuestions: json.questions || [] }));
                        } else if (json.type === "meta") {
                            setState(prev => ({
                                ...prev,
                                model: json.model || "Auto",
                                tokensUsed: json.tokens_used || 0,
                            }));
                        } else if (json.type === "thought" || json.type === "query_step" || json.type === "status") {
                            setState(prev => ({
                                ...prev,
                                researchSteps: [...prev.researchSteps, { type: json.type, content: json.content }]
                            }));
                        } else if (json.type === "thought_time") {
                            setState(prev => ({ ...prev, thoughtTime: json.time || 0 }));
                        } else if (json.type === "error") {
                            setState(prev => ({ ...prev, error: json.message || "Search failed" }));
                        }
                    } catch (e) {
                        console.error("[useSearch] Failed to parse JSON line:", trimmed, e);
                    }
                }
            }

            // --- LLM TITLE GENERATION ---
            // If this is the very first query of a new thread, generate a title asynchronously
            if (!keepHistory || keepHistory.length === 0) {
                fetch(`${API_BASE}/api/v1/search/title`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: q }),
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.title) {
                            try {
                                const threadsJson = localStorage.getItem("orivanta_threads");
                                if (threadsJson) {
                                    const threads: ThreadData[] = JSON.parse(threadsJson);
                                    const currentId = threadIdRef.current;
                                    const threadIdx = threads.findIndex(t => t.id === currentId || t.query === q);
                                    if (threadIdx >= 0) {
                                        threads[threadIdx].title = data.title;
                                        localStorage.setItem("orivanta_threads", JSON.stringify(threads));
                                        // Trigger a custom event so the Sidebar can re-render immediately
                                        window.dispatchEvent(new Event("orivanta_threads_updated"));
                                    }
                                }
                            } catch (e) {
                                console.error("Failed to update thread title:", e);
                            }
                        }
                    })
                    .catch(err => console.error("Title generation failed:", err));
            }

        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") return;
            const msg = err instanceof Error ? err.message : "Search failed";
            setState(prev => ({
                ...prev,
                error: msg,
                isConnecting: false,
            }));
        } finally {
            console.log("[useSearch] runSearch finally block reached. Sources count:", state.sources.length);
            setState(prev => {
                const nextState = { ...prev, isStreaming: false, isConnecting: false };

                // --- LOCAL STORAGE PERSISTENCE ---
                if (typeof window !== "undefined" && !nextState.error && nextState.answer) {
                    try {
                        const threadsJson = localStorage.getItem("orivanta_threads");
                        let threads: ThreadData[] = threadsJson ? JSON.parse(threadsJson) : [];

                        let currentThreadId = threadIdRef.current;
                        if (!currentThreadId) {
                            currentThreadId = generateThreadId();
                            threadIdRef.current = currentThreadId;
                        }
                        nextState.threadId = currentThreadId; // Attach to state for UI if needed

                        const existingIdx = threads.findIndex(t => t.id === currentThreadId);

                        const threadToSave: ThreadData = {
                            id: currentThreadId,
                            title: existingIdx >= 0 && threads[existingIdx].title ? threads[existingIdx].title : nextState.query,
                            createdAt: existingIdx >= 0 ? threads[existingIdx].createdAt : Date.now(),
                            updatedAt: Date.now(),
                            query: nextState.query,
                            history: nextState.history,
                            answer: nextState.answer,
                            sources: nextState.sources,
                            images: nextState.images,
                        };

                        if (existingIdx >= 0) {
                            threads[existingIdx] = threadToSave;
                        } else {
                            threads.unshift(threadToSave);
                        }

                        localStorage.setItem("orivanta_threads", JSON.stringify(threads));
                        // Dispatch event for Sidebar
                        window.dispatchEvent(new Event("orivanta_threads_updated"));
                    } catch (e) {
                        console.error("Failed to save thread to localStorage:", e);
                    }
                }

                return nextState;
            });
        }
    }, []);

    const appendQuery = useCallback((newQuery: string) => {
        if (!newQuery.trim() || state.isConnecting || state.isStreaming) return;

        let newHistory = state.history;
        if (state.query && state.answer) {
            newHistory = [...state.history, {
                query: state.query,
                answer: state.answer,
                sources: state.sources,
                images: state.images
            }];
        }

        const backendMessages = newHistory.flatMap(msg => [
            { role: "user", content: msg.query },
            { role: "assistant", content: msg.answer }
        ]);

        runSearch(newQuery, focusMode, backendMessages, newHistory);
    }, [state, focusMode, runSearch]);

    useEffect(() => {
        // If we are passing an existing threadId, DO NOT run search, hydrate instead
        if (existingThreadId && !hasStarted.current) {
            if (typeof window !== "undefined") {
                try {
                    const threadsJson = localStorage.getItem("orivanta_threads");
                    if (threadsJson) {
                        const threads: ThreadData[] = JSON.parse(threadsJson);
                        const thread = threads.find(t => t.id === existingThreadId);
                        if (thread) {
                            setState(prev => ({
                                ...prev,
                                threadId: thread.id,
                                history: thread.history,
                                query: thread.query,
                                answer: thread.answer,
                                sources: thread.sources,
                                images: thread.images,
                                isConnecting: false,
                                isStreaming: false
                            }));
                            threadIdRef.current = thread.id;
                            hasStarted.current = true;
                            lastProcessedQuery.current = thread.query;
                            return; // Stop here, fully hydrated!
                        }
                    }
                } catch (e) {
                    console.error("Failed to hydrate thread:", e);
                }
            }
        }

        // Otherwise (or if hydration failed), run fresh search if query changed
        if (!initialQuery || (hasStarted.current && lastProcessedQuery.current === initialQuery)) return;

        hasStarted.current = true;
        lastProcessedQuery.current = initialQuery;

        runSearch(initialQuery, focusMode);
        return () => {
            // We abort the in-flight request on cleanup
            console.log("[useSearch] useEffect Cleanup triggered");
            abortRef.current?.abort();
            lastProcessedQuery.current = null;
        };
    }, [initialQuery, focusMode, existingThreadId, runSearch]);

    return { ...state, appendQuery, retry: () => runSearch(state.query, focusMode) };
}
