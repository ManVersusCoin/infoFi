import { useState } from "react";
import { Share2 } from "lucide-react";
import StatsShareModal from "./StatsShareModal"; // new component (see below)

interface RankingProfileCardProps {
    p: any;
    selectedTopics: any[];
    topicsForDataset: any[];
    getTopicMeta: any;
    dataset: "tournament" | "7d" | "30d";
    metric: "rankTotal" | "rankSignal" | "rankNoise";
}

function RankingProfileCard({
    p,
    selectedTopics,
    topicsForDataset,
    getTopicMeta,
    dataset,
    metric,
}: RankingProfileCardProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div
            key={p.userId}
            className="relative bg-gray-100 dark:bg-gray-800 rounded-xl p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
            {/* Share icon */}
            <button
                onClick={() => setModalOpen(true)}
                className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full"
                title="Share stats"
            >
                <Share2 size={14} />
            </button>

            <div className="flex items-center gap-3 mb-3">
                <img
                    src={p.avatarUrl || "/default-avatar.jpg"}
                    alt={p.name}
                    className="w-10 h-10 rounded-full border"
                />
                <div className="flex flex-col min-w-0">
                    <a
                        href={`https://x.com/${p.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 dark:text-blue-400 truncate"
                    >
                        @{p.handle}
                    </a>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {p.name}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {(selectedTopics.length > 0
                    ? selectedTopics.map((s) => getTopicMeta(s))
                    : topicsForDataset
                ).map((tmeta) => {
                    const r = (p as any).ranksFiltered
                        ? (p as any).ranksFiltered[tmeta.topicSlug]
                        : undefined;
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
                            <span className="ml-auto text-blue-600 dark:text-blue-400 font-semibold">
                                #{display}
                            </span>
                        </div>
                    );
                })}
            </div>

            {modalOpen && (
                <StatsShareModal
                    profile={p}
                    selectedTopics={selectedTopics}
                    topicsForDataset={topicsForDataset}
					dataset={dataset}
                    metric={metric}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

export default RankingProfileCard;
