interface SourceCardProps {
    index: number;
    title: string;
    url: string;
    domain: string;
    faviconUrl?: string;
    snippet?: string;
    isActive?: boolean;
}

export default function SourceCard({ index, title, url, domain, faviconUrl, snippet, isActive }: SourceCardProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`source-card ${isActive ? "source-card--active" : ""}`}
            id={`source-${index}`}
        >
            <div className="source-card-inner">
                {/* Index badge */}
                <div className="source-card-index">{index}</div>

                {/* Content */}
                <div className="source-card-content">
                    {/* Header: favicon + domain */}
                    <div className="source-card-header">
                        <div className="source-card-icon-img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=64`}
                                alt=""
                                width={16}
                                height={16}
                                onError={(e) => {
                                    (e.currentTarget as any).style.display = 'none';
                                    (e.currentTarget as any).parentElement.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe opacity-40"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/></svg>';
                                }}
                            />
                        </div>
                        <span className="source-card-domain">{domain}</span>
                        <svg
                            className="source-card-external"
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" x2="21" y1="14" y2="3" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h4 className="source-card-title">{title}</h4>

                    {/* Snippet */}
                    {snippet && <p className="source-card-snippet">{snippet}</p>}
                </div>
            </div>
        </a>
    );
}
