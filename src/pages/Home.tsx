﻿import { motion } from "framer-motion";
import clsx from "clsx";

interface FeatureCardProps {
    title: string;
    description: string;
    image: string;
    link?: string;
    active?: boolean;
    isNew?: boolean;
}

const features: FeatureCardProps[] = [
    {
        title: "Xeet Pack Generator",
        description:
            "Select your favorite profiles and generate a fake shareable Xeet collector cards.",
        image: "/images/profile-pack.png",
        link: "/pack-generator",
        active: true,
        isNew: true,
    },
    {
        title: "Airdrop Card Generator",
        description:
            "Create your fake airdrop claim card.",
        image: "/images/airdrop-card.png",
        link: "/airdrop-card",
        active: true,
        isNew: true,
    },
    {
        title: "CryptDads Jokes",
        description:
            "Let your CryptoDads share their best jokes.",
        image: "/images/dad-jokes.png",
        link: "/dad-jokes",
        active: true,
        isNew: true,
    },
    {
        title: "Leaderboards",
        description:
            "Explore top profiles ranked by influence and insights. Compare across topics and timeframes.",
        image: "/images/xeet-leaderboards.png",
        link: "/leaderboard",
        active: false,
    },
    
    {
        title: "Xeet Analysis",
        description:
            "Dive into advanced analytics for Xeet data, with tournaments and signal breakdowns.",
        image: "/images/xeet.jpg",
        active: false,
    },
    {
        title: "Wallchain Analysis",
        description:
            "Dive into advanced analytics for Wallchain data, with campaigns and signal breakdowns.",
        image: "/images/wallchain.jpg",
        active: false, 
    },
    
];

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Titre principal */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-10 text-center">
                    Discover some useless tools for {" "}
                    <span className="text-blue-500">Web3</span>
                </h1>

                {/* Grille de cartes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => {
                        const CardWrapper = feature.active ? "a" : "div";

                        return (
                            <motion.div
                                key={idx}
                                whileHover={feature.active ? { scale: 1.03 } : {}}
                                whileTap={feature.active ? { scale: 0.98 } : {}}
                                className={clsx(
                                    "relative block rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 transition-all",
                                    !feature.active && "opacity-70 grayscale"
                                )}
                            >
                                {/* Si la carte est active → lien cliquable */}
                                <CardWrapper
                                    {...(feature.active
                                        ? { href: feature.link }
                                        : { "aria-disabled": true })}
                                    className="block w-full h-full"
                                >
                                    {/* Image */}
                                    <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Badge NEW */}
                                        {feature.isNew && (
                                            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                                NEW
                                            </span>
                                        )}

                                        {/* Overlay “Available soon” */}
                                        {!feature.active && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold">
                                                    Available soon
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contenu */}
                                    <div className="p-5">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {feature.title}
                                        </h2>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </CardWrapper>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
