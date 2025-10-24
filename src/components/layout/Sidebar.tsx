import { NavLink } from "react-router-dom";
import { Home, Trophy, Github, X, Gift, Laugh, CircleDollarSign } from "lucide-react";

interface SidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/pack-generator", label: "Xeet pack generator", icon: Trophy },
    { to: "/airdrop-card", label: "Airdrop Card generator", icon: Gift },
    { to: "/dad-jokes", label: "CryptoDad Jokes", icon: Laugh },
    { to: "/earning-card", label: "Creator Earning Card", icon: CircleDollarSign },
];

export default function Sidebar({ open, setOpen }: SidebarProps) {
    return (
        <>
            {/* === Desktop Sidebar === */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                {/* Contenu principal scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* --- Logo + Title --- */}
                    <div className="flex items-center gap-3 mb-8">
                        
                        <img
                            src="/logo.png" 
                            alt="WUT"
                            className="w-20 h-20 rounded-xl shadow-sm bg-gray-100 dark:bg-gray-700 p-1"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                WUT
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Web3 Useless Tools
                            </p>
                        </div>
                    </div>

                    {/* --- Navigation --- */}
                    <nav className="space-y-2">
                        {links.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-xl px-3 py-2 transition ${isActive
                                        ? "bg-blue-500 text-white"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* --- Footer --- */}
                <footer className="border-t border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                        <a
                            href="https://github.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-blue-500"
                        >
                            <Github size={16} />
                            <span>GitHub</span>
                        </a>
                        <span className="opacity-70">v1.0.0</span>
                    </div>

                    {/* Disclaimer */}
                    <p className="mt-3 text-[11px] leading-tight italic opacity-80">
                        Not affiliated with Xeet, Wallchain, or any mentioned
                        projects. For fun purposes only.
                    </p>
                </footer>
            </aside>

            {/* === Mobile Sidebar (drawer) === */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Fond sombre cliquable */}
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setOpen(false)}
                />

                <div className="relative w-64 bg-white dark:bg-gray-800 h-full p-4 flex flex-col justify-between">
                    {/* --- Header mobile --- */}
                    <div>
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-8 mt-2">
                            <img
                                src="/logo.png"
                                alt="WUT Logo"
                                className="w-9 h-9 rounded-xl shadow-sm bg-gray-100 dark:bg-gray-700 p-1"
                            />
                            <div>
                                <h2 className="text-lg font-bold leading-tight">
                                    WUT
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Web3 Useless Tools
                                </p>
                            </div>
                        </div>

                        {/* --- Nav links --- */}
                        <nav className="space-y-2">
                            {links.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-xl px-3 py-2 transition ${isActive
                                            ? "bg-blue-500 text-white"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        }`
                                    }
                                >
                                    <Icon size={18} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* --- Footer mobile --- */}
                    <footer className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-500 dark:text-gray-400">
                        <a
                            href="https://github.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-blue-500"
                        >
                            <Github size={16} />
                            <span>GitHub</span>
                        </a>
                        <p className="mt-2 text-[11px] italic opacity-80">
                            Not affiliated with Xeet, Wallchain, or any mentioned
                            projects.
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
