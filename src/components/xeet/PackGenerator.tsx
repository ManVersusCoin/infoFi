import { useState, useRef } from "react";
import * as htmlToImage from "dom-to-image";
import MultiSelectBar from "../ui/MultiSelectBar";
import CardPack from "./CardPack";
import { AlertTriangle } from "lucide-react";

const domtoimageTyped = htmlToImage as any;
export default function PackGenerator({ allProfiles }: { allProfiles: any[] }) {
    const [selected, setSelected] = useState<{ value: string; label: string; imageUrl: string }[]>([]);
    const packRef = useRef<HTMLDivElement>(null);

    // Ensure allProfiles is defined before using it
    const selectedProfiles = allProfiles ? allProfiles.filter((p) =>
        selected.some((s) => s.value === p.id)
    ) : [];

    const handleCopy = async () => {
        if (!packRef.current) return;

        try {
            const dataUrl = await domtoimageTyped.toPng(packRef.current, {
                quality: 1,
                bgcolor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-pack'),
            });

            // Create a temporary link to download the image
            

            // Copy the image to the clipboard
            const blob = await fetch(dataUrl).then((res) => res.blob());
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            alert("📋 Pack image copied to clipboard!");
        } catch (error) {
            console.error("Error copying image:", error);
            alert("Failed to copy image to clipboard.");
        }
    };

    const handleDownload = async () => {
        if (!packRef.current) return;

        try {
            const dataUrl = await domtoimageTyped.toPng(packRef.current, {
                quality: 1,
                bgcolor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-pack'),
            });

            // Create a temporary link to download the image
            const link = document.createElement("a");
            link.download = "profile-pack.png";
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error downloading image:", error);
            alert("Failed to download image.");
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
                    <div ref={packRef} className="bg-white dark:bg-gray-900">
                        <CardPack profiles={selectedProfiles} />
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                        >
                            📸 Copy Pack to Clipboard
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        >
                            📥 Download Pack
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}