import Link from "next/link";

export default function Header() {
    return (
        <header className="header" id="main-header">
            <div className="header-left">
                <Link href="/" className="header-logo">
                    <img src="/logo.svg" alt="Orivanta AI" width={32} height={32} />
                    <span className="header-brand">Orivanta</span>
                </Link>
            </div>
            <div className="header-center">
                {/* Compact SearchBar for inner pages */}
            </div>
            <div className="header-right">
                {/* ThemeToggle + Avatar */}
            </div>
        </header>
    );
}
