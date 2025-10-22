import React from "react";
import ProfileCard from "./ProfileCard";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: {
        name: string;
        handle: string;
        number: string;
        imageUrl: string;
        rarity?: "common" | "rare" | "epic" | "mythical";
    } | null;
}

export default function ProfileModal({ isOpen, onClose, profile }: ProfileModalProps) {
    if (!isOpen || !profile) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-gray-900/90 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
                >
                    ✕
                </button>

                <ProfileCard
                    name={profile.name}
                    handle={profile.handle}
                    number={profile.number}
                    imageUrl={profile.imageUrl}
                    rarity={profile.rarity}
                />
            </div>
        </div>
    );
}
