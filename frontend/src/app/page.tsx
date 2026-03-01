import { SearchBar } from "@/components/search";

export default function HomePage() {
    return (
        <div className="home-page">
            <div className="home-hero">
                <h1 className="home-title">
                    Where knowledge <span className="gradient-text">begins</span>
                </h1>
                <p className="home-subtitle">
                    Ask anything. Get cited answers from the web, powered by AI.
                </p>
                <SearchBar />
            </div>

            <section className="home-trending">
                <h2 className="section-title">Trending</h2>
                <div className="trending-grid">{/* TrendingCard components */}</div>
            </section>
        </div>
    );
}
