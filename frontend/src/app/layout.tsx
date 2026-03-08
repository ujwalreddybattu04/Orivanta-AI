import type { Metadata } from "next";
import "@/styles/variables.css";
import "@/styles/globals.css";
import "@/styles/typography.css";
import "@/styles/animations.css";
import "@/styles/sidebar.css";
import "@/styles/searchbar.css";
import "@/styles/home.css";
import "@/styles/thread.css";
import "@/styles/components/PrivateToggle.css";
import { Sidebar } from "@/components/layout";
import { SITE_TITLE, SITE_DESCRIPTION } from "@/config/constants";

export const metadata: Metadata = {
    title: `${SITE_TITLE} — AI-Powered Answer Engine`,
    description: SITE_DESCRIPTION,
    openGraph: {
        title: SITE_TITLE,
        description: "AI-Powered Answer Engine",
        url: "https://corten.ai",
        siteName: SITE_TITLE,
        type: "website",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div className="app-shell">
                    <Sidebar />
                    <main className="main-content">{children}</main>
                </div>
            </body>
        </html>
    );
}
