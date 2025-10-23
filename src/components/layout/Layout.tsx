import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { motion, AnimatePresence } from "framer-motion";
import {  X } from "lucide-react";
export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFooter, setShowFooter] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;

            // Masquer si on descend, afficher si on monte ou atteint le bas
            if (current > lastScrollY && current > 100) {
                setShowFooter(false);
            } else {
                setShowFooter(true);
            }

            // Toujours afficher si bas de page
            if (window.innerHeight + current >= document.body.offsetHeight - 20) {
                setShowFooter(true);
            }

            setLastScrollY(current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            {/* Main area */}
            <div className="flex flex-col flex-1 relative">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Main content */}
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>

                {/* Animated footer */}
                <AnimatePresence>
                    {showFooter && (
                        <motion.footer
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 px-6 py-3 fixed bottom-0 left-0 right-0 md:left-64 z-20"
                        >
                            <div className="flex justify-center items-center flex-wrap gap-1">
                                <span>{new Date().getFullYear()} - WUT - Web3 Useless Tools - By</span>
                                <a
                                    href="https://x.com/man_versus_coin"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-500 transition"
                                >
                                    <X size={14} />
                                    <span>@man_versus_coin</span>
                                </a>
                            </div>
                        </motion.footer>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
