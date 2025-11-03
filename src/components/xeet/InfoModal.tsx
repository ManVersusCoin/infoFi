import { useState } from "react";
import { Info } from "lucide-react";

export default function InfoModal() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Info Button */}
            <button
                onClick={() => setOpen(true)}
                className=" z-50 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-lg transition"
                title="About the Rankings"
            >
                <Info size={20} />
            </button>

            {/* Modal Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 w-full max-w-3xl rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] transition-all"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">🏆 About the Leaderboard</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 text-sm leading-relaxed">
                            <p>
                                The leaderboard combines multiple topic-based rankings into a unified view of user performance across the entire Xeet ecosystem.
                            </p>

                            <h3 className="font-semibold text-lg mt-4">🧠 1. Data source</h3>
                            <p>
                                All leaderboard data is loaded from an aggregated file compiling xeet tournaments and signals data. Each profile includes global info
                                and a list of topics with ranks for three periods: <strong>Tournament</strong>, <strong>7D Signals</strong>,
                                and <strong>30D Signals</strong>.
                            </p>

                            <ul className="list-disc list-inside">
                                <li><code>rankSignal</code> — ranking based on signal accuracy</li>
                                <li><code>rankNoise</code> — ranking based on signal noise</li>
                                <li><code>rankTotal</code> — overall performance combining both</li>
                            </ul>

                            <h3 className="font-semibold text-lg mt-4">⚙️ 2. Metrics & filtering</h3>
                            <p>
                                You can filter by dataset, metric, topics, Top N cutoff, or topic overlap.
                                Profiles not ranked in any topic under the current filters are automatically hidden.
                            </p>

                            <h3 className="font-semibold text-lg mt-4">🧮 3. Sorting logic</h3>
                            <ul className="list-disc list-inside">
                                <li><strong>Single topic:</strong> sorted by rank in that topic and metric.</li>
                                <li><strong>Multiple topics:</strong> sorted by best rank across topics, then by the sum of ranks.</li>
                                <li><strong>No topic selected:</strong> sorted by a global score rewarding both rank and topic coverage.</li>
                            </ul>

                            <p className="italic mt-2">
                                Global score formula:
                                <code>score = Σ ((topLimit - rank + 1) / topLimit)</code>
                            </p>

                            <h3 className="font-semibold text-lg mt-4">📊 4. Noise / Signal ratio</h3>
                            <p>
                                Each topic also displays a <strong>Noise-to-Signal ratio (%)</strong> and its own rank.
                                This metric highlights users producing strong, consistent signals with minimal noise.
                            </p>

                            <h3 className="font-semibold text-lg mt-4">🧩 5. Display modes</h3>
                            <ul className="list-disc list-inside">
                                <li><strong>Card view:</strong> the default grid display for quick browsing.</li>
                                <li><strong>Table view:</strong> a detailed mode shown when one topic is selected.</li>
                            </ul>

                            <h3 className="font-semibold text-lg mt-4">🔁 6. Updates & caching</h3>
                            <p>
                                Data is refreshed daily. A caching mechanism ensures <code>latest.json</code> updates only once per day
                                after midnight to reduce unnecessary API calls while keeping rankings up to date.
                            </p>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
