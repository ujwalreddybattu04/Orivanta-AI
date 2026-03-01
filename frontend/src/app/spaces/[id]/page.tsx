export default function SpaceDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="space-detail-page">
            <div className="space-detail-header">
                {/* SpaceHeader — title, description, custom instructions */}
            </div>
            <div className="space-detail-content">
                <div className="space-threads">
                    {/* Thread list within this space */}
                </div>
                <aside className="space-files-panel">
                    {/* FileUpload + file list */}
                </aside>
            </div>
            <div className="space-members">
                {/* MemberList component */}
            </div>
        </div>
    );
}
