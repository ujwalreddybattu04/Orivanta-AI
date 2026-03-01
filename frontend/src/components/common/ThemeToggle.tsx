"use client";

import { useThemeStore } from "@/store/useThemeStore";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            id="theme-toggle"
        >
            {theme === "dark" ? "☀️" : "🌙"}
        </button>
    );
}
