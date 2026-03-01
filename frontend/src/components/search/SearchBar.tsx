"use client";

import { useState, FormEvent } from "react";
import { FocusMode } from "@/components/search";

export default function SearchBar() {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        // Navigate to search results
    };

    return (
        <form className="search-bar" onSubmit={handleSubmit} id="search-bar">
            <div className="search-bar-input-wrapper">
                <input
                    type="text"
                    className="search-bar-input"
                    placeholder="Ask anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    id="search-input"
                />
                <button type="submit" className="search-bar-submit" id="search-submit-btn">
                    →
                </button>
            </div>
            <FocusMode />
        </form>
    );
}
