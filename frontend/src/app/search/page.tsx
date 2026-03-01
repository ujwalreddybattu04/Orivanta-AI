import { Suspense } from "react";

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="loading-skeleton" />}>
            <div className="search-page">
                <div className="search-answer-container">
                    {/* AnswerStream component — streamed AI response */}
                </div>
                <aside className="search-sources-panel">
                    {/* SourcesPanel component — numbered source cards */}
                </aside>
                <section className="search-related">
                    {/* RelatedQuestions component */}
                </section>
            </div>
        </Suspense>
    );
}
