"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, FormEvent } from "react";
import { useRouter } from "next/navigation";

const FOCUS_TABS = [
    { value: "all", label: "All" },
    { value: "academic", label: "Academic" },
    { value: "writing", label: "Writing" },
    { value: "math", label: "Math" },
];

export interface SearchBarHandle {
    setQueryAndSubmit: (q: string) => void;
}

const SearchBar = forwardRef<SearchBarHandle, object>(function SearchBar(_, ref) {
    const [query, setQuery] = useState("");
    const [focusMode, setFocusMode] = useState("all");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        setQueryAndSubmit(q: string) {
            setQuery(q);
            inputRef.current?.focus();
            // Short delay so React flushes the new value before navigation
            setTimeout(() => {
                router.push(`/search?q=${encodeURIComponent(q)}&focus=all`);
            }, 60);
        },
    }));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}&focus=${focusMode}`);
    };

    return (
        <form className="search-bar" onSubmit={handleSubmit} id="search-bar">
            <div className="search-bar-container">
                {/* Input Row */}
                <div className="search-input-row">
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-bar-input"
                        placeholder="What's on your mind?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        id="search-input"
                    />
                </div>

                {/* Focus Mode + Model + Submit Row */}
                <div className="search-focus-row">
                    {/* Add button */}
                    <button type="button" className="focus-add-btn" title="Add file or connector" id="focus-add-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>

                    {/* Focus tabs */}
                    <div className="focus-tabs">
                        {FOCUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                className={`focus-tab ${focusMode === tab.value ? "active" : ""}`}
                                onClick={() => setFocusMode(tab.value)}
                                id={`focus-tab-${tab.value}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Model selector + Submit */}
                    <div className="search-model-selector">
                        <button type="button" className="model-dropdown-btn" id="model-selector-btn">
                            Auto <span className="model-dropdown-arrow">▾</span>
                        </button>
                        <button type="submit" className="search-submit-btn" id="search-submit-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
});

export default SearchBar;
