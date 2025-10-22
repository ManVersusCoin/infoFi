import ProfileCard from "./ProfileCard";

interface CardPackProps {
    profiles: {
        id: string;
        name: string;
        handle: string;
        number: string;
        imageUrl: string;
        score?: number;
        rarity?: "common" | "rare" | "epic" | "mythical";
    }[];
}

export default function CardPack({ profiles }: CardPackProps) {
    return (
        <div className="relative flex flex-wrap justify-center overflow-hidden p-8">
            {profiles.map((p, i) => (
                <div
                    key={p.id}
                    className="transition-transform"
                    style={{
                        transform: `rotate(${(Math.random() - 0.5) * 10}deg) translateY(${i * 2}px)`, // Limite la rotation
                        margin: "0 -1.5rem", // Ajuste les marges pour équilibrer
                        zIndex: profiles.length + i, // Assure que les cartes du haut sont visibles
                    }}
                >
                    <ProfileCard
                        name={p.name}
                        handle={p.handle}
                        number={p.number}
                        imageUrl={p.imageUrl}
                        score={p.score}
                        rarity={p.rarity}
                    />
                </div>
            ))}
        </div>
    );
}