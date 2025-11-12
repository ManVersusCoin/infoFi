import { useState } from "react";
import { Share2 } from "lucide-react";
import StatsShareModal from "./StatsShareModal";

// --- Types for 'p' (profile) prop ---
type RankEntry = {
    rankTotal?: number;
    rank?: number;
    rankSignal?: number;
    rankNoise?: number;
    totalPoints?: number;
};

type Profile = {
    userId?: string;
    handle: string;
    avatarUrl?: string;
    name?: string;
    ranksFiltered: Record<string, RankEntry | undefined>;
};

// --- Types for Topic Metadata ---
interface TopicMetaIn {
    topicSlug?: string;
    companyId?: string;
    id?: string;
    logoUrl?: string;
    title?: string;
    companyName?: string;
}

type NormalizedTopicMeta = {
    topicSlug: string;
    logoUrl?: string;
    title?: string;
};

type NormalizedTopicMetaLoose = {
    topicSlug: string | undefined;
    logoUrl?: string;
    title?: string | undefined;
};

interface RankingProfileCardProps {
    p: Profile;
    selectedTopics: string[] | TopicMetaIn[];
    topicsForDataset: NormalizedTopicMeta[];
    getTopicMeta: (slug: string) => TopicMetaIn | undefined; // The raw getter
    dataset: "tournament" | "7d" | "30d";
    metric: "rankTotal" | "rankSignal" | "rankNoise";
}

function RankingProfileCard({
    p,
    selectedTopics,
    topicsForDataset,
    getTopicMeta, // This is the raw getter: (slug: string) => TopicMetaIn | undefined
    dataset,
    metric,
}: RankingProfileCardProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const normalizeTopicMeta = (
        t: string | TopicMetaIn | undefined
    ): NormalizedTopicMetaLoose | undefined => {
        if (!t) return undefined;
        if (typeof t === "string") {
            const raw = getTopicMeta ? getTopicMeta(t) : undefined;
            return {
                topicSlug: t,
                logoUrl: raw?.logoUrl,
                title: raw?.companyName ?? raw?.title ?? t,
            };
        }
        const topicSlug = t.topicSlug || t.companyId || t.id;
        const title = t.companyName || t.title || topicSlug;
        return {
            topicSlug: topicSlug,
            logoUrl: t.logoUrl,
            title: title,
        };
    };

    const topicsToShowRaw: (string | TopicMetaIn)[] =
        Array.isArray(selectedTopics) && selectedTopics.length > 0
            ? selectedTopics
            : (topicsForDataset as TopicMetaIn[]);

    const topicsToShow = topicsToShowRaw
        .map(normalizeTopicMeta)
        .filter(
            (x): x is NormalizedTopicMeta =>
                !!x && !!x.topicSlug && typeof x.topicSlug === "string"
        );

    const getNumericRank = (profile: Profile, slug: string) => {
        if (!profile?.ranksFiltered) return undefined;
        const r = profile.ranksFiltered[slug];
        if (!r || typeof r !== "object") return undefined;

        const rankTotal = typeof r.rankTotal === "number" ? r.rankTotal : undefined;
        const rank = typeof r.rank === "number" ? r.rank : undefined;
        const rankSignal = typeof r.rankSignal === "number" ? r.rankSignal : undefined;
        const rankNoise = typeof r.rankNoise === "number" ? r.rankNoise : undefined;

        let value: number | undefined;
        if (metric === "rankTotal") value = rankTotal ?? rank;
        else if (metric === "rankSignal") value = rankSignal ?? rankTotal ?? rank;
        else if (metric === "rankNoise") value = rankNoise ?? rankTotal ?? rank;
        else value = rankTotal ?? rank;

        return typeof value === "number" && Number.isFinite(value) ? value : undefined;
    };

    const sortTopicsByRank = (topics: NormalizedTopicMeta[]) => {
        return [...topics].sort((a, b) => {
            const rankA = getNumericRank(p, a.topicSlug);
            const rankB = getNumericRank(p, b.topicSlug);
            if (rankA === undefined && rankB === undefined) return 0;
            if (rankA === undefined) return 1;
            if (rankB === undefined) return -1;
            return rankA - rankB;
        });
    };

    const renderedTopics = sortTopicsByRank(topicsToShow);

    const slugsForModal: string[] = (
        Array.isArray(selectedTopics) && selectedTopics.length > 0
            ? selectedTopics
            : topicsForDataset
    )
        .map((t) => normalizeTopicMeta(t)?.topicSlug)
        .filter((x): x is string => !!x);

    // --- SOLUTION ---
    // Create an "adapter" function to pass to the modal.
    // This function matches the signature StatsShareModal likely expects:
    // (slug: string) => NormalizedTopicMeta
    const getNormalizedTopicMetaForModal = (slug: string): NormalizedTopicMeta => {
        const raw = getTopicMeta(slug); // Use the original raw getter
        return {
            topicSlug: slug,
            logoUrl: raw?.logoUrl,
            title: raw?.companyName ?? raw?.title ?? slug, // Fallback to slug if no meta
        };
    };
    // --- END SOLUTION ---

    return (
        <div
            key={p.userId ?? p.handle}
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

            {/* Profile Header */}
            <div className="flex items-center gap-3 mb-3">
                <img
                    src={p.avatarUrl || "/default-avatar.jpg"}
                    alt={p.name ?? p.handle}
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
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{p.name}</span>
                </div>
            </div>

            {/* Ranks Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {renderedTopics.map((tmeta) => {
                    const slug = tmeta.topicSlug;
                    const rank = getNumericRank(p, slug);
                    if (typeof rank !== "number") return null;
                    return (
                        <div
                            key={slug}
                            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md"
                        >
                            <img
                                src={tmeta.logoUrl || "/default-avatar.jpg"}
                                alt={tmeta.title ?? slug}
                                className="w-4 h-4 rounded-full border"
                            />
                            <span className="truncate">{tmeta.title ?? slug}</span>
                            <span className="ml-auto text-blue-600 dark:text-blue-400 font-semibold">#{rank}</span>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {modalOpen && (
                <StatsShareModal
                    profile={p}
                    selectedTopics={slugsForModal}
                    topicsForDataset={topicsForDataset}
                    // MODIFIED: Pass the new normalized getter function
                    getTopicMeta={getNormalizedTopicMetaForModal}
                    dataset={dataset}
                    metric={metric}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

export default RankingProfileCard;