import { useEffect, useState } from "react";
import PackGenerator from "../../components/xeet/PackGenerator";

interface Profile {
    id: string;
    name: string;
    handle: string;
    number: number;
    imageUrl: string;
    rarity: string;
    score: number;
    mindsharePct?: number;
}

const getRarity = (score: number) => {
    if (score >= 800) return "mythical";
    if (score >= 400) return "epic";
    if (score >= 100) return "rare";
    return "common";
};

export default function XeetPackGeneratorPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await fetch("/leaderboards/xeet-infofi/latest-30d.json");
                const data = await res.json();
                const formatted = data.map((p: any, index: number) => ({
                    id: p.twitterId || `user-${index}`,
                    name: p.name || "Unknown",
                    handle: p.handle || "unknown",
                    number: index + 1,
                    imageUrl: p.avatarUrl || "/default-avatar.jpg",
                    rarity: getRarity(p.score ?? 0),
                    score: p.score ?? 0,
                    mindsharePct: p.mindsharePct,
                }));
                setProfiles(formatted);
            } catch (err) {
                console.error("Failed to load leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-300">
                Loading profiles...
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-8 text-center">
                    Xeet Fake Pack Generator
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            You can select profiles from the list below to generate your custom Xeet profile pack.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mt-4">
                            Only profiles in the top 400 from the latest 30 days Xeet-info leaderboard are available.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Search Profiles
                        </h2>
                        <PackGenerator allProfiles={profiles} />
                    </div>
                </div>
            </div>
        </div>
    );
}