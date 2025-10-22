import { useEffect, useState, useMemo } from "react";
import ProfileModal from "./xeet/ProfileModal";
type Period = "7d" | "30d";

interface LeagueAnalysisProps {
    leaguePrefix: "xeet" | "wallchain";
    leagueTitle?: string;
    topicsPath?: string;
}

interface XeetLeaderboardEntry {
    twitterId: string;
    username?: string;
    avatarUrl?: string;
    rank?: number;
}

interface TopicData {
    topic: string;
    period: Period;
    profiles: XeetLeaderboardEntry[];
}

interface ProfileInfo {
    topics: Set<string>;
    profile?: XeetLeaderboardEntry;
    ranks: Record<string, number>;
}

interface Topic {
    slug: string;
    name: string;
    logoUrl: string;
    bannerUrl?: string;
    description?: string;
    endDate?: string;
}

function normalizeTopic(raw: any, leaguePrefix: string): Topic | null {
    if (leaguePrefix === "wallchain") {
        if (raw.section === "finished") return null; // on filtre ici
        return {
            slug: raw.companyId, // utilisé dans les chemins leaderboard
            name: raw.companyName,
            logoUrl: raw.logoUrl,
            bannerUrl: raw.backgroundImageUrl,
            description: raw.description,
            endDate: raw.countdown?.endDate,
        };
    }

    // par défaut (xeet ou autres)
    if (leaguePrefix === "xeet") {
        if (!raw.isLeague) return null; // on filtre ici
        return {
            slug: raw.topicSlug,
            name: raw.title,
            logoUrl: raw.logoUrl,
            bannerUrl: raw.banner,
            description: raw.description,
            endDate: raw.endDate,
        };
    }
}

const PROFILES_PER_PAGE = 30;
function AllProfilesSection({ profileMap, topics }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const profilesPerPage = 12;
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fusionner les profils des deux périodes
    const allProfiles = useMemo(() => {
        const merged: Record<string, { id: string; seven?: ProfileInfo; thirty?: ProfileInfo }> = {};

        for (const [id, info] of Object.entries(profileMap["7d"] || {})) {
            merged[id] = { id, seven: info };
        }
        for (const [id, info] of Object.entries(profileMap["30d"] || {})) {
            if (!merged[id]) merged[id] = { id };
            merged[id].thirty = info;
        }
        return Object.values(merged);
    }, [profileMap]);

    // Filtrage par recherche
    const filteredProfiles = useMemo(() => {
        return allProfiles.filter((p) => {
            const username =
                p.seven?.profile?.username ||
                p.thirty?.profile?.username ||
                "";
            return username.toLowerCase().includes(search.toLowerCase());
        });
    }, [search, allProfiles]);

    // Tri : par nombre total de topics classés puis rank moyen
    const sortedProfiles = useMemo(() => {
        return filteredProfiles.sort((a, b) => {
            const topicsA =
                (a.seven?.topics.size || 0) + (a.thirty?.topics.size || 0);
            const topicsB =
                (b.seven?.topics.size || 0) + (b.thirty?.topics.size || 0);
            if (topicsA !== topicsB) return topicsB - topicsA;

            const avgRankA =
                averageRank(a.seven?.ranks) + averageRank(a.thirty?.ranks);
            const avgRankB =
                averageRank(b.seven?.ranks) + averageRank(b.thirty?.ranks);
            return avgRankA - avgRankB;
        });
    }, [filteredProfiles]);

    function averageRank(ranks?: Record<string, number>) {
        if (!ranks) return 9999;
        const vals = Object.values(ranks);
        if (vals.length === 0) return 9999;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    const totalPages = Math.ceil(sortedProfiles.length / profilesPerPage);
    const paginatedProfiles = sortedProfiles.slice(
        (page - 1) * profilesPerPage,
        page * profilesPerPage
    );

    const getTopicLogo = (slug: string) =>
        topics.find((t) => t.slug === slug)?.logoUrl || "/public/default-avatar.jpg";

    return (
        <div className="bg-gray-200 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mt-12">
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-6">
                All Profiles Overview
            </h2>

            {/* Barre de recherche */}
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search profile..."
                    className="w-full md:w-1/2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                />
                <span className="text-gray-600 dark:text-gray-400 text-sm ml-4">
                    {filteredProfiles.length} profiles found
                </span>
            </div>

            {/* Grille de profils */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paginatedProfiles.map((p) => {
                    const username =
                        p.seven?.profile?.username ||
                        p.thirty?.profile?.username ||
                        p.id;
                    const avatar =
                        p.seven?.profile?.avatarUrl ||
                        p.thirty?.profile?.avatarUrl ||
                        "/public/default-avatar.jpg";

                    return (
                        <div
                            key={p.id}
                            onClick={() => {
                                setSelectedProfile({
                                    name: username,
                                    handle: username,
                                    number: p.id,
                                    imageUrl: avatar,
                                    rarity: "mythical",
                                });
                                setIsModalOpen(true);
                            }}
                            className="cursor-pointer bg-gray-300/40 dark:bg-gray-700/40 rounded-lg border border-gray-400 dark:border-gray-600 p-4 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={avatar}
                                    alt={username}
                                    className="w-10 h-10 rounded-full border border-gray-400 dark:border-gray-600"
                                />
                                <a
                                    href={`https://x.com/${username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-800 dark:text-white font-medium hover:underline truncate"
                                >
                                    @{username}
                                </a>
                            </div>

                            {/* Classements 7d & 30d */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Bloc 7d */}
                                <div className="bg-gray-100/50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-300 dark:border-gray-700">
                                    <h3 className="text-blue-600 dark:text-blue-400 font-semibold mb-2 text-sm">
                                        7d Rankings
                                    </h3>
                                    {p.seven && Object.keys(p.seven.ranks).length > 0 ? (
                                        <div className="space-y-1">
                                            {Object.entries(p.seven.ranks)
                                                .sort(([, a], [, b]) => a - b)
                                                .map(([topic, rank]) => (
                                                    <div
                                                        key={topic}
                                                        className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-200/60 dark:bg-gray-800/60 px-2 py-1 rounded"
                                                    >
                                                        <img
                                                            src={getTopicLogo(topic)}
                                                            alt={topic}
                                                            className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-600"
                                                        />
                                                        <span className="truncate">{topic}</span>
                                                        <span className="ml-auto text-blue-600 dark:text-blue-400 font-medium">
                                                            #{rank}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-500 text-xs italic">
                                            No 7d rankings
                                        </p>
                                    )}
                                </div>

                                {/* Bloc 30d */}
                                <div className="bg-gray-100/50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-300 dark:border-gray-700">
                                    <h3 className="text-green-600 dark:text-green-400 font-semibold mb-2 text-sm">
                                        30d Rankings
                                    </h3>
                                    {p.thirty && Object.keys(p.thirty.ranks).length > 0 ? (
                                        <div className="space-y-1">
                                            {Object.entries(p.thirty.ranks)
                                                .sort(([, a], [, b]) => a - b)
                                                .map(([topic, rank]) => (
                                                    <div
                                                        key={topic}
                                                        className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-200/60 dark:bg-gray-800/60 px-2 py-1 rounded"
                                                    >
                                                        <img
                                                            src={getTopicLogo(topic)}
                                                            alt={topic}
                                                            className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-600"
                                                        />
                                                        <span className="truncate">{topic}</span>
                                                        <span className="ml-auto text-green-600 dark:text-green-400 font-medium">
                                                            #{rank}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-500 text-xs italic">
                                            No 30d rankings
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-6 gap-3">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded disabled:opacity-40"
                >
                    ← Prev
                </button>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Page {page} / {totalPages}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded disabled:opacity-40"
                >
                    Next →
                </button>
            </div>
            {/* Modal */}
            <ProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profile={selectedProfile}
            />
        </div>
    );
}

export default function LeagueAnalysis({
    leaguePrefix,
    leagueTitle = "League Analysis",
    topicsPath,
}: LeagueAnalysisProps) {
    const [topics, setTopics] = useState<{ slug: string; title: string; logoUrl?: string }[]>([]);
    const [distribution, setDistribution] = useState<Record<Period, Record<number, number>>>({
        "7d": {},
        "30d": {},
    });
    const [profileMap, setProfileMap] = useState<Record<Period, Record<string, ProfileInfo>>>({
        "7d": {},
        "30d": {},
    });
    const [loading, setLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState<{ period: Period; count: number } | null>(null);

    // Load topics
    useEffect(() => {
        async function loadTopics() {
            try {
                const res = await fetch(topicsPath || `/${leaguePrefix}_topics_raw.json`);
                let  data = await res.json();
                if (leaguePrefix === "xeet") {
                    data = data.data;
                }
                console.log(data)
                const normalized = data
                    .map((t: any) => normalizeTopic(t, leaguePrefix))
                    .filter((t: any) => t !== null);

                setTopics(normalized);
            } catch (err) {
                console.error(`⚠️ Failed to load ${leaguePrefix} topics`, err);
            }
        }

        loadTopics();
    }, [leaguePrefix, topicsPath]);

    // Load leaderboard data for all topics
    useEffect(() => {
        if (topics.length === 0) return;

        async function loadData() {
            setLoading(true);
            const PERIODS: Period[] = ["7d", "30d"];
            const results: TopicData[] = [];

            for (const period of PERIODS) {
                for (const t of topics) {
                    const latestDate = await findLatestDate(t.slug, period);
                    if (!latestDate) continue;

                    try {
                        const res = await fetch(`/leaderboards/${t.slug}/${latestDate}/${leaguePrefix}-${period}.json`);
                        const json = await res.json();
                        const entries: XeetLeaderboardEntry[] = Array.isArray(json) ? json : json.data || [];
                        const valid = entries
                            .filter((e) => e.twitterId)
                            .map((e, i) => ({
                                twitterId: e.twitterId,
                                username: e.username || e.handle || e.name || e.twitter_handle || e.id,
                                avatarUrl: e.avatarUrl || "/public/default-avatar.jpg",
                                rank: i + 1,
                            }));

                        results.push({ topic: t.slug, period, profiles: valid });
                    } catch {
                        console.warn(`⚠️ Failed to load Xeet ${t.slug} ${period}`);
                    }
                }
            }

            // Compute overlap stats
            const dist: Record<Period, Record<number, number>> = { "7d": {}, "30d": {} };
            const profMap: Record<Period, Record<string, ProfileInfo>> = { "7d": {}, "30d": {} };

            for (const period of PERIODS) {
                const map = new Map<string, ProfileInfo>();
                const subset = results.filter((r) => r.period === period);

                subset.forEach((t) => {
                    t.profiles.forEach((p) => {
                        if (!map.has(p.twitterId)) {
                            map.set(p.twitterId, {
                                topics: new Set(),
                                profile: p,
                                ranks: {},
                            });
                        }
                        const entry = map.get(p.twitterId)!;
                        entry.topics.add(t.topic);
                        entry.ranks[t.topic] = p.rank!;
                    });
                });

                const counts: Record<number, number> = {};
                const profs: Record<string, ProfileInfo> = {};
                map.forEach((v, id) => {
                    const n = v.topics.size;
                    counts[n] = (counts[n] || 0) + 1;
                    profs[id] = v;
                });

                dist[period] = counts;
                profMap[period] = profs;
            }

            setDistribution(dist);
            setProfileMap(profMap);
            setLoading(false);
        }

        loadData();
    }, [topics]);

    async function findLatestDate(topic: string, period: Period): Promise<string | null> {
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const formattedDate = d.toISOString().slice(0, 10);
            try {
                const res = await fetch(`/leaderboards/${topic}/${formattedDate}/xeet-${period}.json`);
                if (res.ok) return formattedDate;
            } catch {
                continue;
            }
        }
        return null;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-500"></div>
            </div>
        );
    }

    const maxTopics = topics.length;
    const handleCellClick = (period: Period, count: number) => {
        setSelectedCell({ period, count });
    };

    const selectedProfiles =
        selectedCell &&
        Object.entries(profileMap[selectedCell.period])
            .filter(([_, v]) => v.topics.size === selectedCell.count)
            .map(([id, v]) => ({ id, ...v }));

    const groupedProfiles =
        selectedProfiles &&
        Object.values(
            selectedProfiles.reduce((acc, p) => {
                const key = Array.from(p.topics).sort().join(" | ");
                if (!acc[key]) acc[key] = { topics: Array.from(p.topics), profiles: [] };
                acc[key].profiles.push(p);
                return acc;
            }, {} as Record<string, { topics: string[]; profiles: typeof selectedProfiles }>),
        ).sort((a, b) => b.profiles.length - a.profiles.length);

    const getTopicLogo = (slug: string) =>
        topics.find((t) => t.slug === slug)?.logoUrl || "/public/default-avatar.jpg";

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">{leagueTitle} ranking Analysis</h1>

            {/* Topics list */}
            <div className="flex flex-wrap gap-4 mb-8">
                {topics.map((t) => (
                    <div
                        key={t.slug}
                        className="flex items-center gap-2 bg-gray-200/70 dark:bg-gray-800/70 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
                    >
                        <img
                            src={t.logoUrl || "/public/xeet.jpg"}
                            alt={t.name}
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700"
                        />
                        <span className="text-sm">{t.name}</span>
                    </div>
                ))}
            </div>
            {/* Introduction section */}
            <div className="bg-gray-200/70 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    This table shows how many unique profiles appear in the
                    <span className="text-blue-600 dark:text-blue-400 font-semibold"> top 400 {leagueTitle} leaderboards </span>
                    across all analyzed topics. Each cell indicates the number of profiles ranked in
                    exactly that many topics (e.g., profiles appearing in 3 topics are counted under “3 topics”).
                    The analysis covers both
                    <span className="text-blue-600 dark:text-blue-400 font-semibold"> 7-day</span> and
                    <span className="text-blue-600 dark:text-blue-400 font-semibold"> 30-day</span> aggregation periods,
                    considering only the <span className="text-blue-600 dark:text-blue-400 font-semibold"> top 400</span> profiles per topic.
                </p>
            </div>

            {/* Flipped main table */}
            <div className="overflow-x-auto bg-gray-200 dark:bg-gray-800 rounded-lg shadow mb-8">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-300 dark:bg-gray-700">
                            <th className="py-3 px-4 border-b border-gray-400 dark:border-gray-600">Period</th>
                            {Array.from({ length: maxTopics }, (_, i) => i + 1).map((n) => (
                                <th key={n} className="py-3 px-4 border-b border-gray-400 dark:border-gray-600 text-center">
                                    {n} topic{n > 1 ? "s" : ""}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(["7d", "30d"] as Period[]).map((per) => (
                            <tr key={per} className="hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                                <td
                                    className={`py-3 px-4 border-b border-gray-300 dark:border-gray-700 font-semibold ${per === "7d" ? "bg-gray-200/60 dark:bg-gray-800/60" : "bg-gray-200/40 dark:bg-gray-800/40"
                                        }`}
                                >
                                    {per}
                                </td>
                                {Array.from({ length: maxTopics }, (_, i) => i + 1).map((n) => (
                                    <td
                                        key={`${per}-${n}`}
                                        className={`py-3 px-4 border-b border-gray-300 dark:border-gray-700 text-center cursor-pointer hover:bg-gray-400/50 dark:hover:bg-gray-600/50 ${selectedCell?.period === per && selectedCell?.count === n ? "bg-blue-600/40 dark:bg-blue-600/40" : ""
                                            }`}
                                        onClick={() => handleCellClick(per, n)}
                                    >
                                        {distribution[per]?.[n] ?? 0}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Details view - groups on 3 columns */}
            {selectedCell && groupedProfiles && (
                <div className="bg-gray-200/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mt-6">
                    <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-6">
                        {selectedCell.period.toUpperCase()} – {selectedCell.count} topics overlap
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedProfiles.map((group) => (
                            <div
                                key={group.topics.join("|")}
                                className="bg-gray-300/40 dark:bg-gray-700/40 rounded-lg border border-gray-400 dark:border-gray-600 p-4"
                            >
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {group.topics.map((t) => (
                                        <span
                                            key={t}
                                            className="bg-blue-500/20 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                        >
                                            <img
                                                src={getTopicLogo(t)}
                                                alt={t}
                                                className="w-3.5 h-3.5 rounded-full border border-gray-400 dark:border-gray-600"
                                            />
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                                    {group.profiles.length} profile{group.profiles.length > 1 ? "s" : ""}
                                </p>

                                {/* List of profiles */}
                                <div className="space-y-2">
                                    {group.profiles.map((p) => (
                                        <div
                                            key={p.id}
                                            className="bg-gray-200/60 dark:bg-gray-800/60 rounded-lg p-2 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <img
                                                    src={p.profile?.avatarUrl || "/public/default-avatar.jpg"}
                                                    alt={p.profile?.username || p.id}
                                                    className="w-8 h-8 rounded-full border border-gray-400 dark:border-gray-600"
                                                />
                                                <a
                                                    href={`https://x.com/${p.profile?.username || p.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-800 dark:text-white text-sm hover:underline truncate"
                                                >
                                                    @{p.profile?.username || p.id}
                                                </a>
                                            </div>

                                            {/* topic ranks table */}
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                                                {group.topics.map((topic) => (
                                                    <div
                                                        key={topic}
                                                        className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-900/50 px-2 py-1 rounded"
                                                    >
                                                        <img
                                                            src={getTopicLogo(topic)}
                                                            alt={topic}
                                                            className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-600"
                                                        />
                                                        <span className="truncate">{topic}</span>
                                                        <span className="ml-auto text-blue-600 dark:text-blue-400 font-medium">
                                                            #{p.ranks[topic] ?? "-"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <AllProfilesSection profileMap={profileMap} topics={topics} />
        </div>
    );
}