import ThemeToggle from "./ThemeToggle";
import MobileMenuButton from "./MobileMenuButton";

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
                <MobileMenuButton onClick={onMenuClick} />
                <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <ThemeToggle />
        </header>
    );
}
