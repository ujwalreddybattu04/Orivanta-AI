import { SearchBar, QuickActions } from "@/components/search";
import { StarField } from "@/components/common";
import PrivateToggle from "@/components/common/PrivateToggle";
import { BRAND_NAME } from "@/config/constants";

export default function HomePage() {
    return (
        <div className="home-page">
            <PrivateToggle />
            <StarField />
            <div className="home-hero">
                <h1 className="home-title">{BRAND_NAME}</h1>
                <SearchBar />
                <QuickActions />
            </div>
        </div>
    );
}
