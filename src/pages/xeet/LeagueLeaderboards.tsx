import { useEffect, useMemo, useRef, useState } from "react";

/*
  LeagueLeaderboards.tsx
  - React + Vite + Tailwind (no external UI libs)
  - Features:
    * Load /xeet_topics_raw.json and /leaderboards/{topic}/latest-*.json
    * Dataset selector (Tournament / 7D / 30D)
    * Metric selector for 7D/30D (rankTotal / rankSignal / rankNoise)
    * Top N selector (includes 50..1000)
    * Topic multi-select as a DROPDOWN with logos, searchable
    * Topic-overlap filter dynamically limited to selected topics count
    * Sorting: single topic -> sort by that topic rank; multiple -> best rank (then sum)
    * Pagination, 3 columns on desktop
    * Dark/light ready (relies on tailwind darkMode: 'class')
*/

type Topic = {
    id: string;
    title: string;
    topicSlug: string;
    logoUrl?: string | null;
    isLeague: boolean;
};

type LeaderboardEntry = Record<string, any> & {
    userId: string;
    handle?: string;
    name?: string;
    avatarUrl?: string | null;
};

type UserProfile = {
    userId: string;
    handle?: string;
    name?: string;
    avatarUrl?: string | null;
    ranks: Record<string, number>;
};

const TOP_OPTIONS = [50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

export default function LeagueLeaderboards(): JSX.Element {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [leaderboardCount, setLeaderboardCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // UI state
    const [dataset, setDataset] = useState<"tournament" | "7d" | "30d">("tournament");
    const [metric, setMetric] = useState<"rankTotal" | "rankSignal" | "rankNoise">("rankTotal");
    const [topLimit, setTopLimit] = useState<number>(100);
    const [profileSearch, setProfileSearch] = useState<string>("");

    // topics dropdown
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
    const [topicQuery, setTopicQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // topic overlap filter (topicCountFilter)
    const [topicCountFilter, setTopicCountFilter] = useState<number | null>(null);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // close dropdown on outside click
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!dropdownRef.current) return;
            if (!dropdownRef.current.contains(e.target as Node)) setTopicDropdownOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    // Fetch data when dataset/metric/topLimit change
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const topicsResp = await fetch('/xeet_topics_raw.json');
                const allTopics: Topic[] = await topicsResp.json();
                const leagues = allTopics.filter(t => t.isLeague);
                setTopics(leagues);

                const userMap: Record<string, UserProfile> = {};
                let totalEntries = 0;

                for (const t of leagues) {
                    const path = dataset === 'tournament'
                        ? `/leaderboards/${t.topicSlug}/latest-tournament.json`
                        : dataset === '7d'
                            ? `/leaderboards/${t.topicSlug}/latest-7d.json`
                            : `/leaderboards/${t.topicSlug}/latest-30d.json`;

                    try {
                        const res = await fetch(path);
                        if (!res.ok) continue;
                        const json: LeaderboardEntry[] = await res.json();

                        // keep entries where chosen metric <= topLimit (metric might be undefined for tournaments)
                        const filtered = json.filter(entry => {
                            // for tournament dataset, the dataset uses 'rankTotal' etc. If not present, fallback to 'rankTotal' if exists
                            const val = (entry as any)[metric];
                            return typeof val === 'number' ? val <= topLimit : false;
                        });

                        totalEntries += filtered.length;

                        for (const e of filtered) {
                            const uid = e.userId;
                            if (!uid) continue;
                            if (!userMap[uid]) userMap[uid] = { userId: uid, handle: e.handle, name: e.name, avatarUrl: e.avatarUrl, ranks: {} };
                            const rankValue = (e as any)[metric];
                            if (typeof rankValue === 'number') {
                                // keep the best (lowest) rank per topic
                                const prev = userMap[uid].ranks[t.topicSlug];
                                if (prev === undefined || rankValue < prev) userMap[uid].ranks[t.topicSlug] = rankValue;
                            }
                        }
                    } catch (err) {
                        // ignore single topic failure
                        // console.warn('fetch', path, err);
                    }
                }

                setProfiles(Object.values(userMap));
                setLeaderboardCount(totalEntries);
                setCurrentPage(1);
            } catch (err) {
                console.error('load error', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [dataset, metric, topLimit]);

    // topicCount stats (global) used when no topics selected
    const globalTopicCountStats = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const p of profiles) {
            const c = Object.keys(p.ranks).length;
            counts[c] = (counts[c] || 0) + 1;
        }
        return counts; // e.g. {1: 120, 2: 50}
    }, [profiles]);

    // dynamic topic-count options: if topics selected, limit to 1..selectedTopics.length, else use global stats keys
    const topicCountOptions = useMemo(() => {
        if (selectedTopics.length > 0) {
            const max = selectedTopics.length;
            const opts: { count: number, num: number }[] = [];
            for (let i = 1; i <= max; i++) {
                // compute number of profiles that appear in exactly i of the SELECTED topics
                let num = 0;
                for (const p of profiles) {
                    let c = 0;
                    for (const s of selectedTopics) if (p.ranks[s] !== undefined) c++;
                    if (c === i) num++;
                }
                opts.push({ count: i, num });
            }
            return opts;
        }
        // else use globalTopicCountStats
        return Object.keys(globalTopicCountStats).map(k => ({ count: Number(k), num: globalTopicCountStats[Number(k)] })).sort((a, b) => a.count - b.count);
    }, [selectedTopics, profiles, globalTopicCountStats]);

    // Filtering and sorting of profiles for display
    const filteredProfiles = useMemo(() => {
        // base filter by search
        let arr = profiles.filter(p => {
            const q = profileSearch.trim().toLowerCase();
            if (!q) return true;
            return (p.name || '').toLowerCase().includes(q) || (p.handle || '').toLowerCase().includes(q);
        });

        // filter by selectedTopics (must appear in at least one selected topic)
        if (selectedTopics.length > 0) {
            arr = arr.filter(p => selectedTopics.some(slug => p.ranks[slug] !== undefined));
        }

        // filter by topicCountFilter if set
        if (topicCountFilter !== null) {
            if (selectedTopics.length > 0) {
                // when topics selected, topicCountFilter refers to counts WITHIN selected topics (exact match)
                arr = arr.filter(p => {
                    let c = 0; for (const s of selectedTopics) if (p.ranks[s] !== undefined) c++;
                    return c === topicCountFilter;
                });
            } else {
                // global exact match
                arr = arr.filter(p => Object.keys(p.ranks).length === topicCountFilter);
            }
        }

        // Sorting rules
        if (selectedTopics.length === 1) {
            const slug = selectedTopics[0];
            arr.sort((a, b) => {
                const ra = a.ranks[slug] ?? Infinity;
                const rb = b.ranks[slug] ?? Infinity;
                if (ra !== rb) return ra - rb;
                // tie-breaker by name
                return (a.name || a.handle || '').localeCompare(b.name || b.handle || '', undefined, { sensitivity: 'base' });
            });
        } else if (selectedTopics.length > 1) {
            // compute best rank and sum rank among selected topics
            arr = arr.map(p => {
                let best = Infinity;
                let sum = 0;
                let count = 0;
                for (const s of selectedTopics) {
                    const v = p.ranks[s];
                    if (v !== undefined) { best = Math.min(best, v); sum += v; count++; }
                }
                // if user doesn't appear in any selected topics, keep best=Infinity
                return { ...p, __bestRank: best, __sumRank: sum, __countInSelected: count };
            }).sort((a: any, b: any) => {
                const ba = a.__bestRank ?? Infinity;
                const bb = b.__bestRank ?? Infinity;
                if (ba !== bb) return ba - bb; // smaller best rank first
                if ((a.__sumRank ?? Infinity) !== (b.__sumRank ?? Infinity)) return (a.__sumRank ?? Infinity) - (b.__sumRank ?? Infinity);
                return (a.name || a.handle || '').localeCompare(b.name || b.handle || '', undefined, { sensitivity: 'base' });
            });
        } else {
            // no topic selected: default sort by name
            arr.sort((a, b) => (a.name || a.handle || '').localeCompare(b.name || b.handle || '', undefined, { sensitivity: 'base' }));
        }

        return arr;
    }, [profiles, profileSearch, selectedTopics, topicCountFilter]);

    // pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / itemsPerPage));
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages]);
    const start = (currentPage - 1) * itemsPerPage;
    const pageProfiles = filteredProfiles.slice(start, start + itemsPerPage);

    // helpers
    const toggleTopic = (slug: string) => {
        setSelectedTopics(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
        setCurrentPage(1);
    };
    const clearTopics = () => { setSelectedTopics([]); setCurrentPage(1); };

    // visible topics in dropdown search
    const visibleTopics = useMemo(() => {
        const q = topicQuery.trim().toLowerCase();
        if (!q) return topics;
        return topics.filter(t => t.title.toLowerCase().includes(q) || t.topicSlug.toLowerCase().includes(q));
    }, [topics, topicQuery]);

    return (
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
            {/* SUMMARY HEADER */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                    <strong className="text-lg">{profiles.length}</strong> unique profiles
                </div>
                <div className="text-sm">
                    <strong className="text-lg">{topics.length}</strong> active leagues
                </div>
                <div className="text-sm">
                    <strong className="text-lg">{leaderboardCount}</strong> leaderboard entries (Top {topLimit})
                </div>
                {selectedTopics.length === 1 && (
                    <div className="w-full sm:w-auto text-sm text-gray-600 dark:text-gray-300 mt-2 sm:mt-0">
                        Showing profiles for <span className="font-semibold">{topics.find(t => t.topicSlug === selectedTopics[0])?.title || selectedTopics[0]}</span>
                        {` — sorted by ${metric}`}
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <select value={dataset} onChange={e => { setDataset(e.target.value as any); setCurrentPage(1); }} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <option value="tournament">Tournament (Rank)</option>
                        <option value="7d">7D Signals</option>
                        <option value="30d">30D Signals</option>
                    </select>

                    {(dataset === '7d' || dataset === '30d') && (
                        <select value={metric} onChange={e => { setMetric(e.target.value as any); setCurrentPage(1); }} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <option value="rankTotal">Total Rank</option>
                            <option value="rankSignal">Signal Rank</option>
                            <option value="rankNoise">Noise Rank</option>
                        </select>
                    )}

                    <select value={topLimit} onChange={e => { setTopLimit(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                        {TOP_OPTIONS.map(n => <option key={n} value={n}>Top {n}</option>)}
                    </select>

                    {/* Topics dropdown trigger */}
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setTopicDropdownOpen(o => !o)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <span>{selectedTopics.length === 0 ? 'Select topics' : `${selectedTopics.length} selected`}</span>
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>

                        {topicDropdownOpen && (
                            <div className="absolute z-40 mt-2 w-72 max-h-72 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                                <div className="p-2">
                                    <input value={topicQuery} onChange={e => setTopicQuery(e.target.value)} placeholder="Search topics..." className="w-full px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                                </div>
                                <div className="px-2 py-1 max-h-56 overflow-y-auto">
                                    <div className="flex items-center justify-between px-1 py-1">
                                        <div className="text-xs text-gray-500">Click to toggle topics</div>
                                        <div className="text-xs">
                                            <button onClick={() => { setSelectedTopics(visibleTopics.map(t => t.topicSlug)); }} className="text-xs underline mr-2">Select visible</button>
                                            <button onClick={() => clearTopics()} className="text-xs underline">Clear</button>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-1">
                                        {visibleTopics.map(t => {
                                            const sel = selectedTopics.includes(t.topicSlug);
                                            return (
                                                <label key={t.topicSlug} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${sel ? 'bg-blue-600 text-white' : ''}`}>
                                                    <input type="checkbox" checked={sel} onChange={() => toggleTopic(t.topicSlug)} className="w-4 h-4" />
                                                    <img src={t.logoUrl || '/default-avatar.jpg'} alt={t.title} className="w-6 h-6 rounded-full border" />
                                                    <span className="text-sm truncate">{t.title}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <input value={profileSearch} onChange={e => { setProfileSearch(e.target.value); setCurrentPage(1); }} placeholder="Search profiles..." className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 w-full md:w-64" />
                </div>
            </div>

            {/* Topic-overlap filter dynamic */}
            <div className="flex flex-wrap gap-2">
                {topicCountOptions.map(opt => (
                    <button key={opt.count} onClick={() => setTopicCountFilter(topicCountFilter === opt.count ? null : opt.count)} className={`px-3 py-1 rounded-md border text-sm ${topicCountFilter === opt.count ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'}`}>
                        {opt.count} topic{opt.count > 1 ? 's' : ''}: <strong>{opt.num}</strong>
                    </button>
                ))}
            </div>

            {/* Profiles grid */}
            {loading ? (
                <div className="py-20 text-center text-gray-500">Loading leaderboards...</div>
            ) : (
                <>
                    {filteredProfiles.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">No profiles found.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pageProfiles.map(p => (
                                <div key={p.userId} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={p.avatarUrl || '/default-avatar.jpg'} alt={p.name} className="w-10 h-10 rounded-full border" />
                                        <div className="flex flex-col min-w-0">
                                            <a href={`https://x.com/${p.handle}`} target="_blank" rel="noreferrer" className="font-medium text-blue-600 dark:text-blue-400 truncate">@{p.handle}</a>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{p.name}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        {(selectedTopics.length > 0 ? topics.filter(t => selectedTopics.includes(t.topicSlug)) : topics).map(t => (
                                            <div key={t.topicSlug} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md">
                                                <img src={t.logoUrl || '/default-avatar.jpg'} alt={t.title} className="w-4 h-4 rounded-full border" />
                                                <span className="truncate">{t.title}</span>
                                                <span className="ml-auto text-blue-600 dark:text-blue-400 font-semibold">#{p.ranks[t.topicSlug] ?? '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* pagination controls */}
                    {filteredProfiles.length > itemsPerPage && (
                        <div className="flex justify-center items-center gap-3 my-4 pb-6">
                            <button onClick={() => setCurrentPage(cp => Math.max(1, cp - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50">← Previous</button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(cp => Math.min(totalPages, cp + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 disabled:opacity-50">Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
