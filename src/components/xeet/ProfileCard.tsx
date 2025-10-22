import React from "react";
import clsx from "clsx";

interface ProfileCardProps {
    name: string;
    handle: string;
    number: string;
    imageUrl: string;
    rarity?: "common" | "rare" | "epic" | "mythical";
}

const rarityGradients: Record<string, string> = {
    common: "from-gray-500 to-gray-800",
    rare: "from-blue-500 to-blue-800",
    epic: "from-purple-600 to-indigo-800",
    mythical: "from-pink-500 to-fuchsia-800",
};

const rarityBadgeColors: Record<string, string> = {
    common: "bg-gray-700 text-gray-200 border-gray-500 shadow-gray-400/30",
    rare: "bg-blue-700 text-blue-100 border-blue-400 shadow-blue-400/30",
    epic: "bg-purple-700 text-purple-100 border-purple-400 shadow-purple-400/30",
    mythical: "bg-pink-700 text-pink-100 border-pink-400 shadow-pink-400/30",
};

// Génère un score pseudo-aléatoire mais stable
function generateScore(handle: string, number: string): number {
    const seed = [...(handle + number)].reduce(
        (acc, c) => acc + c.charCodeAt(0),
        0
    );
    const random = Math.sin(seed) * 10000;
    return Math.floor((random - Math.floor(random)) * 100);
}

export default function ProfileCard({
    name,
    handle,
    number,
    imageUrl,
    rarity = "mythical",
}: ProfileCardProps) {
    const score = generateScore(handle, number);

    return (
        <div className="flex justify-center items-center">
            <div
                className={clsx(
                    "relative w-64 h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-b transition-transform hover:scale-[1.02]",
                    rarityGradients[rarity]
                )}
            >
                <div className="absolute top-3 left-3 z-10">
                    <img
                        src="/xeet.jpg"
                        alt="Xeet logo"
                        className="w-8 h-8 rounded-md border border-white/20 shadow-md"
                    />
                </div>
                {/* === Badge de rareté === */}
                <div
                    className={clsx(
                        "absolute top-3 right-3 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-md border backdrop-blur-md shadow-md",
                        rarityBadgeColors[rarity]
                    )}
                >
                    {rarity}
                </div>

                {/* === Section haute : image circulaire === */}
                <div className="h-4/6 flex flex-col justify-center items-center bg-black/10 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-white/10 blur-2xl"></div>

                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-lg z-10">
                        <img
                            src={imageUrl}
                            alt={name}
                            className="w-full h-full object-cover rounded-full"
                        />
                        <div className="absolute inset-0 rounded-full bg-white/10 blur-md"></div>
                    </div>
                </div>

                {/* === Section basse === */}
                <div className="h-2/6 backdrop-blur-lg bg-black/40 text-white flex flex-col justify-between p-4 z-20">
                    <div className="text-left">
                        <h2 className="font-bold text-lg leading-tight">{name}</h2>
                        <p className="text-sm opacity-75">@{handle}</p>
                    </div>

                    <div className="flex justify-between items-end">
                        {/* Score (à gauche à la place de rarity) */}
                        <div className="flex flex-col">
                            <p className="text-xs opacity-70 uppercase">Score</p>
                            <p className="text-xl font-bold text-pink-300">{score}</p>
                        </div>

                        {/* Numéro + logo Signal */}
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                {/* Sinusoïde minimaliste SVG */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 40 12"
                                    className="w-8 h-3 text-pink-300"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M1 6 Q5 1, 9 6 T17 6 T25 6 T33 6 T39 6" />
                                </svg>
                                <span className="text-xs uppercase tracking-wider text-gray-300">
                                    SIGNAL
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Halo général */}
                <div
                    className={clsx(
                        "absolute inset-0 rounded-3xl pointer-events-none opacity-40 blur-xl",
                        rarityGradients[rarity]
                    )}
                ></div>
            </div>
        </div>
    );
}