import { useRef, useState, useEffect } from "react";
import domtoimage from "dom-to-image";
import { X, Copy, Download } from "lucide-react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

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
    const [xeetData, setXeetData] = useState<any>(null);
    const [loadingXeet, setLoadingXeet] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // ------------------------------
    // Toast helpers
    // ------------------------------
    const addToast = (message: string, type: "success" | "error") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    // ------------------------------
    // Fetch Xeet data
    // ------------------------------
    useEffect(() => {
        const fetchXeetData = async () => {
            setLoadingXeet(true);
            try {
                //const res = await fetch(`/api/xeet/user/handle/${profile.handle}`);
                const res = await fetch(`https://www.xeet.ai/api/user/handle/${profile.handle}`);
                if (!res.ok) throw new Error("Failed to fetch Xeet data");
                const json = await res.json();
                setXeetData(json.data);
            } catch (err) {
                console.error("Failed to fetch Xeet data:", err);
                addToast("Failed to load Xeet data", "error");
            } finally {
                setLoadingXeet(false);
            }
        };
        fetchXeetData();
    }, [profile.handle]);

    // ------------------------------
    // Copy / Download handlers
    // ------------------------------
    const handleCopyImage = async () => {
        if (!cardRef.current) return;
        try {
            const blob = await domtoimage.toBlob(cardRef.current);
            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);
            addToast("Image copied to clipboard!", "success");
        } catch {
            addToast("Failed to copy image", "error");
        }
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current) return;
        try {
            const blob = await domtoimage.toBlob(cardRef.current);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${profile.handle}_stats.png`;
            a.click();
            URL.revokeObjectURL(url);
            addToast("Image downloaded!", "success");
        } catch {
            addToast("Failed to download image", "error");
        }
    };

    const displayedTopics =
        selectedTopics.length > 0
            ? selectedTopics.map((s) => topicsForDataset.find((t) => t.topicSlug === s))
            : topicsForDataset;

    const metricLabel = () => {
        if (dataset === "tournament") return "Tournament ranks";
        if (dataset === "7d") {
            if (metric === "rankTotal") return "7D Total ranks";
            if (metric === "rankSignal") return "7D Signal ranks";
            if (metric === "rankNoise") return "7D Noise ranks";
        }
        if (dataset === "30d") {
            if (metric === "rankTotal") return "30D Total ranks";
            if (metric === "rankSignal") return "30D Signal ranks";
            if (metric === "rankNoise") return "30D Noise ranks";
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            {/* Toasts */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`px-4 py-2 rounded shadow font-semibold text-sm ${t.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                            }`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>

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

                {/* Card preview */}
                <div
                    ref={cardRef}
                    className="relative bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-6 flex flex-col justify-between min-h-[400px] w-full"
                >
                    {/* Xeet + logo */}
                    <div className="absolute top-4 right-4 flex items-center gap-3">
                        {loadingXeet ? (
                            <div className="animate-pulse bg-white/20 rounded px-2 py-1 w-20 h-10" />
                        ) : (
                            <div className="flex flex-col items-end bg-black/40 px-3 py-1 rounded-md">
                                <span className="text-pink-400 font-bold text-lg">
                                    {xeetData?.xeetEarned?.toLocaleString()} Xeets
                                </span>
                                <span className="text-white/80 text-xs">{metricLabel()}</span>
                            </div>
                        )}
                        <img
                            src="/xeet.jpg"
                            alt="Xeet"
                            className="w-12 h-12 rounded-md border border-white/20 shadow-md"
                        />
                    </div>

                    {/* Top: Profile info */}
                    <div className="flex items-center gap-4">
                        <img
                            src={profile.avatarUrl || "/default-avatar.jpg"}
                            alt={profile.name}
                            className="w-16 h-16 rounded-full border"
                        />
                        <div>
                            <h2 className="text-lg font-semibold">{profile.name}</h2>
                            <p className="text-sm text-blue-400">@{profile.handle}</p>
                            {/* Followers */}
                            {xeetData && (
                                <p className="text-xs text-white/80">
                                    {xeetData.followerCount.toLocaleString(undefined, {
                                        notation: "compact",
                                        maximumFractionDigits: 1,
                                    })}{" "}
                                    followers
                                </p>
                            )}
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
                                    className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md"
                                >
                                    <img
                                        src={tmeta.logoUrl || "/default-avatar.jpg"}
                                        alt={tmeta.title}
                                        className="w-4 h-4 rounded-full border"
                                    />
                                    <span className="truncate">{tmeta.title}</span>
                                    <span className="ml-auto text-pink-400 font-semibold">#{display}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom */}
                    <div className="w-full flex justify-between items-center text-xs text-white/80">
                        <span className="pl-2">
                            {new Date(profile.generatedAt || Date.now()).toLocaleDateString("en-US")}
                        </span>
                        <span className="pr-3">
                            For fun and informational purposes only / not affiliated with the official Xeet project
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
