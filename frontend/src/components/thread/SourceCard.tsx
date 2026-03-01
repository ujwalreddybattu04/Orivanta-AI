interface SourceCardProps {
    index: number;
    title: string;
    url: string;
    domain: string;
    faviconUrl?: string;
    snippet?: string;
}

export default function SourceCard({ index, title, url, domain, faviconUrl, snippet }: SourceCardProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-card"
            id={`source-${index}`}
        >
            <div className="source-card-index">{index}</div>
            <div className="source-card-content">
                <div className="source-card-header">
                    {faviconUrl && (
                        <img src={faviconUrl} alt="" className="source-card-favicon" width={14} height={14} />
                    )}
                    <span className="source-card-domain">{domain}</span>
                </div>
                <h4 className="source-card-title">{title}</h4>
                {snippet && <p className="source-card-snippet">{snippet}</p>}
            </div>
        </a>
    );
}
