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
        <div className="relative flex flex-wrap justify-center gap-[-3rem] p-8">
            {profiles.map((p, i) => (
                <div
                    key={p.id}
                    className="transition-transform"
                    style={{
                        transform: `rotate(${(Math.random() - 0.5) * 10}deg) translateY(${i * 2}px)`,
                        marginLeft: "-3rem",
                        zIndex: i,
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