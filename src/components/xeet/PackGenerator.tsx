import { useState, useRef } from "react";
import * as htmlToImage from "dom-to-image";
import MultiSelectBar from "../ui/MultiSelectBar";
import CardPack from "./CardPack";
import { AlertTriangle, Copy, Download } from "lucide-react";

const domtoimageTyped = htmlToImage as any;

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

export default function PackGenerator({ allProfiles }: { allProfiles: any[] }) {
    const [selected, setSelected] = useState<{ value: string; label: string; imageUrl: string }[]>([]);
    const packRef = useRef<HTMLDivElement>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };
    // Ensure allProfiles is defined before using it
    const selectedProfiles = allProfiles ? allProfiles.filter((p) =>
        selected.some((s) => s.value === p.id)
    ) : [];

    const handleCopy = async () => {
        if (!packRef.current) return;

        try {
            const dataUrl = await domtoimageTyped.toPng(packRef.current, {
                quality: 1,
                bgcolor: getComputedStyle(document.documentElement).getPropertyValue("--color-bg-pack"),
            });

            const blob = await fetch(dataUrl).then((res) => res.blob());
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            showToast("📋 Pack image copied to clipboard!");
        } catch (error) {
            console.error("Error copying image:", error);
            showToast("❌ Failed to copy image.", "error");
        }
    };

    const handleDownload = async () => {
        if (!packRef.current) return;

        try {
            const dataUrl = await domtoimageTyped.toPng(packRef.current, {
                quality: 1,
                bgcolor: getComputedStyle(document.documentElement).getPropertyValue("--color-bg-pack"),
            });

            const link = document.createElement("a");
            link.download = "profile-pack.png";
            link.href = dataUrl;
            link.click();
            showToast("✅ Pack image downloaded successfully!");
        } catch (error) {
            console.error("Error downloading image:", error);
            showToast("❌ Failed to download image.", "error");
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto text-center mt-12">
            <h2 className="text-2xl font-bold mb-4 text-blue-500 dark:text-blue-400">
                Build Your Profile Pack
            </h2>
            <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 my-4">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>
                    <strong>Disclaimer:</strong> This tool is purely speculative and for
                    recreational purposes only. All rarity levels and scores are fictional and
                    do not represent real data or rankings. Not affiliated with Xeet.
                </span>
            </p>
            <MultiSelectBar
                options={allProfiles ? allProfiles.map((p) => ({
                    value: p.id,
                    label: `@${p.handle}`,
                    imageUrl: p.imageUrl || "/default-avatar.jpg",
                })) : []}
                selected={selected}
                onChange={setSelected}
            />

            {selectedProfiles.length > 0 && (
                <>
                    {/* === EXPORTABLE ZONE === */}
                    <div ref={packRef} className="bg-white dark:bg-gray-900 ">
                        <CardPack profiles={selectedProfiles} />
                    </div>

                    {/* === ACTION BUTTONS BELOW EXPORT AREA === */}
                    <div className="flex justify-center gap-4 mt-6 w-full">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded shadow transition-all"
                        >
                            <Download size={18} />
                            Download
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-5 rounded shadow transition-all"
                        >
                            <Copy size={18} />
                            Copy
                        </button>
                    </div>
                </>
            )}

            {/* === TOASTS === */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-md text-sm text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}