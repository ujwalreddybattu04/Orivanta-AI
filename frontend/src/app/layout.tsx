import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/variables.css";
import "@/styles/animations.css";
import "@/styles/typography.css";
import { Sidebar } from "@/components/layout";

export const metadata: Metadata = {
    title: "Orivanta AI — AI-Powered Answer Engine",
    description:
        "Search smarter with Orivanta AI. Get direct, cited answers powered by advanced AI models.",
    openGraph: {
        title: "Orivanta AI",
        description: "AI-Powered Answer Engine",
        url: "https://orivanta.ai",
        siteName: "Orivanta AI",
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
