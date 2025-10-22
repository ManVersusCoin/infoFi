import { Menu } from "lucide-react";

interface MobileMenuButtonProps {
    onClick: () => void;
}

export default function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
            <Menu size={20} />
        </button>
    );
}
