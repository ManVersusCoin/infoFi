// CryptoDadsTalker.tsx
import { useRef, useState } from "react";
import domtoimage from "dom-to-image";
import { Download, Copy, Shuffle } from "lucide-react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

export default function CryptoDadsTalker() {
    const [nftId, setNftId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [joke, setJoke] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const cardRef = useRef<HTMLDivElement | null>(null);

    const OPENSEA_API_KEY = import.meta.env.VITE_OPENSEA_API_KEY || "";

    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };

    const pickRandom = () => {
        const id = Math.floor(Math.random() * 9999) + 1;
        setNftId(String(id));
        return id;
    };


    // Robust extraction function since OpenSea response shapes can vary
    async function fetchNFT(id: string | number) {
        setLoading(true);
        setImageUrl(null);
        setJoke(null);

        const chain = "base";
        const contract = "0xb2a0fd738d584b47bee18da0f3d7c140bf2d1476";
        const endpoint = `https://api.opensea.io/api/v2/chain/${chain}/contract/${contract}/nfts/${id}`;

        try {
            const headers: Record<string, string> = {
                Accept: "application/json",
            };
            if (OPENSEA_API_KEY) headers["X-API-KEY"] = OPENSEA_API_KEY;

            const res = await fetch(endpoint, { headers });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`OpenSea API error: ${res.status} ${text}`);
            }
            const data = await res.json();

            const nft = data?.nft;
            const traits = nft?.traits || [];

            const dadJokeTrait = traits.find((t: any) => t.trait_type === "Dad Joke");
            const rawJoke = dadJokeTrait?.value || null;

            const cleanedJoke = rawJoke
                ? rawJoke.replace(/^"+|"+$/g, "").trim()
                : "This dad forgot his joke 😅";

            setImageUrl(nft?.image_url || null);
            setJoke(cleanedJoke);
        } catch (err: any) {
            console.error(err);
            showToast("❌ Erreur lors de la récupération depuis OpenSea.", "error");
        } finally {
            setLoading(false);
        }
    }

    const handleFetch = async () => {
        if (!nftId) {
            showToast("Please provide an NFT ID or use Random.", "error");
            return;
        }
        await fetchNFT(nftId);
    };

    const downloadImage = async () => {
        if (!cardRef.current) return showToast("Nothing to export.", "error");
        try {
            const dataUrl = await domtoimage.toPng(cardRef.current, {
                quality: 1,
                bgcolor: getComputedStyle(document.documentElement).getPropertyValue("--color-bg-pack") || "#ffffff",
                style: {
                    // ensure the wrapper rounding/background is captured
                    "border-radius": window.getComputedStyle(cardRef.current).borderRadius || "16px",
                },
            });
            const link = document.createElement("a");
            link.download = `cryptodad-${nftId || "unknown"}.png`;
            link.href = dataUrl;
            link.click();
            showToast("✅ Image downloaded!");
        } catch (e) {
            console.error(e);
            showToast("❌ Failed to download image. (CORS or rendering issue)", "error");
        }
    };

    const copyToClipboard = async () => {
        if (!cardRef.current) return showToast("Nothing to copy.", "error");
        try {
            const dataUrl = await domtoimage.toPng(cardRef.current, {
                quality: 1,
                bgcolor: getComputedStyle(document.documentElement).getPropertyValue("--color-bg-pack") || "#ffffff",
            });
            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            showToast("📋 Copied to clipboard!");
        } catch (e) {
            console.error(e);
            showToast("❌ Failed to copy image. (CORS or browser permission)", "error");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">CryptoDads Joker</h1>

                <div className="flex flex-col sm:flex-row gap-3 mb-8 items-center justify-center">
                    {/* Input and buttons */}
                    <input
                        type="number"
                        min={1}
                        max={9999}
                        value={nftId}
                        onChange={(e) => setNftId(e.target.value)}
                        placeholder="NFT ID (1 - 9999)"
                        className="border rounded px-3 py-2 w-full sm:w-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => { const id = pickRandom(); fetchNFT(id); }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
                        >
                            <Shuffle size={16} />
                            Random
                        </button>
                        <button
                            onClick={handleFetch}
                            className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Fetch
                        </button>
                    </div>
                    {loading && <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">Loading…</div>}
                </div>

                {/* Export area */}
                <div className="flex justify-center mb-8">
                    <div
                        ref={cardRef}
                        className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg"
                        style={{ width: 420, padding: 18, display: "inline-block" }}
                    >
                        {/* Container to ensure rounded clipping (helps dom-to-image) */}
                        <div className="relative rounded-xl overflow-hidden" style={{ background: "#e6eef8" }}>
                            {/* Avatar */}
                            {imageUrl ? (
                                <div className="relative w-100 h-100 mx-auto">
                                    <img
                                        src={imageUrl}
                                        alt={`CryptoDad ${nftId}`}
                                        className="w-full h-full object-cover rounded-md"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = "0.5";
                                        }}
                                    />

                                    {/* Bubble */}
                                    {joke && (
                                        <div
                                            className="absolute left-4 bottom-8 max-w-[80%] p-3 rounded-2xl"
                                            style={{
                                                background: "white",
                                                color: "#111827",
                                                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                                                transform: "translateY(0)",
                                            }}
                                        >
                                            <p className="text-md leading-snug break-words whitespace-pre-wrap">{joke}</p>
                                            {/* little triangle */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    left: "40%",
                                                    bottom: "100%",
                                                    width: 0,
                                                    height: 0,
                                                    borderLeft: "8px solid transparent",
                                                    borderRight: "8px solid transparent",
                                                    borderBottom: "10px solid white",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-100 h-100 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                    Image will appear here
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* action buttons */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={downloadImage}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                    >
                        <Download size={16} /> Download
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded"
                    >
                        <Copy size={16} /> Copy
                    </button>
                </div>

                {/* toasts */}
                <div className="fixed bottom-4 right-4 space-y-2 z-50">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`px-4 py-3 rounded-lg text-sm text-white ${t.type === "success" ? "bg-green-600" : "bg-red-600"}`}
                        >
                            {t.message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
