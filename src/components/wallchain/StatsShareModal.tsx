import { useRef } from "react";
import domtoimage from "dom-to-image";
import { X, Copy, Download } from "lucide-react";

interface StatsShareModalProps {
    profile: any;
    selectedTopics: any[];
    topicsForDataset: any[];
    dataset: "tournament" | "7d" | "30d";
    metric: "rankTotal" | "rankSignal" | "rankNoise";
    onClose: () => void;
}

export default function StatsShareModal({
    profile,
    selectedTopics,
    topicsForDataset,
    dataset,
    metric,
    onClose,
}: StatsShareModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleCopyImage = async () => {
        if (!cardRef.current) return;
        const blob = await domtoimage.toBlob(cardRef.current);
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current) return;
        const blob = await domtoimage.toBlob(cardRef.current);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${profile.handle}_stats.png`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const displayedTopics =
        selectedTopics.length > 0
            ? selectedTopics.map((s) => topicsForDataset.find((t) => t.topicSlug === s))
            : topicsForDataset;

    const metricLabel = () => {
        if (dataset === "tournament") return "Current Epoch ranks";
        else if (dataset === "7d") {
            if (metric === "rankTotal") return "7D Total ranks";
            if (metric === "rankSignal") return "7D Signal ranks";
            if (metric === "rankNoise") return "7D Noise ranks";
            
        } else if (dataset === "30d") {
            if (metric === "rankTotal") return "30D Total ranks";
            if (metric === "rankSignal") return "30D Signal ranks";
            if (metric === "rankNoise") return "730DD Noise ranks";
            
        }
        
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
                >
                    <X size={20} />
                </button>

                {/* Card preview area */}
                <div
                    ref={cardRef}
                    className="relative bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-6 flex flex-col justify-between min-h-[400px] w-full"
                >
                    {/* Xeet logo top-right */}
                    <div className="absolute top-4 right-4 flex flex-col items-end text-xs">
                        <img
                            src="/wallchain.jpg"
                            alt="Wallchain"
                            className="w-12 h-12 mb-1 rounded-md border border-white/20 shadow-md"
                        />
                        <span className="text-white/80">{metricLabel()}</span>
                    </div>

                    {/* Top: Profile Info */}
                    <div className="flex items-center gap-4">
                        <img
                            src={profile.avatarUrl || "/default-avatar.jpg"}
                            alt={profile.name}
                            className="w-16 h-16 rounded-full border"
                        />
                        <div>
                            <h2 className="text-lg font-semibold">{profile.name}</h2>
                            <p className="text-sm text-blue-400">@{profile.handle}</p>
                        </div>
                    </div>

                    {/* Middle: Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm my-8">
                        {displayedTopics.map((tmeta) => {
                            const r = profile.ranksFiltered?.[tmeta.topicSlug];
                            const display = r
                                ? metric === "rankTotal"
                                    ? r.rankTotal
                                    : metric === "rankSignal"
                                        ? r.rankSignal
                                        : r.rankNoise
                                : "-";
                            if (display === "-" || display === 0) return null;
                            return (
                                <div
                                    key={tmeta.topicSlug}
                                    className="flex items-center gap-2  bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md"
                                >
                                    {/*<img
                                        src={tmeta.logoUrl || "/default-avatar.jpg"}
                                        alt={tmeta.title}
                                        className="w-4 h-4 rounded-full border"
                                    />
                                    <img
                                        src={`/api/proxy-image?url=${encodeURIComponent(tmeta.logoUrl)}`}
                                        alt={tmeta.title}
                                        className="w-4 h-4 rounded-full border"
                                    />
                                    */
                                    }
                                    <img
                                        src={`${tmeta.logoUrl}`}
                                        alt={tmeta.title}
                                        className="w-4 h-4 rounded-full border"
                                    />
                                    <span className="truncate">{tmeta.title}</span>
                                    <span className="ml-auto text-yellow-400 font-semibold">
                                        #{display}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom: Disclaimer + generation date */}
                    <div className="w-full flex justify-between items-center text-xs text-white/80">
                        <span className="pl-2">
                            {new Date(profile.generatedAt || Date.now()).toLocaleDateString("en-US")}
                        </span>
                        <span className="pr-3">
                            For fun and informational purposes only / not affiliated with the official Wallchain project
                        </span>
                    </div>
                </div>


                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleCopyImage}
                        className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
                    >
                        <Copy size={16} />
                        Copy PNG
                    </button>
                    <button
                        onClick={handleDownloadImage}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        <Download size={16} />
                        Download PNG
                    </button>
                </div>
            </div>
        </div>
    );
}
