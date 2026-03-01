export interface FocusModeConfig {
    value: string;
    label: string;
    icon: string;
    description: string;
}

export const FOCUS_MODES: FocusModeConfig[] = [
    { value: "all", label: "All", icon: "🌐", description: "Search the entire web" },
    { value: "academic", label: "Academic", icon: "🎓", description: "Scholar, arXiv, PubMed" },
    { value: "youtube", label: "YouTube", icon: "▶️", description: "Video results" },
    { value: "reddit", label: "Reddit", icon: "💬", description: "Community discussions" },
    { value: "writing", label: "Writing", icon: "✍️", description: "Writing assistance" },
    { value: "math", label: "Math", icon: "🔢", description: "Step-by-step solutions" },
    { value: "social", label: "Social", icon: "🐦", description: "Social discussions" },
];
