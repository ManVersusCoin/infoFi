import { useRef, useState } from "react";
import domtoimage from "dom-to-image";
import { CheckCircle, XCircle, Download, Copy } from "lucide-react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

export default function AirdropCardCustomizer() {
    const cardRef = useRef<HTMLDivElement>(null);
    const [eligible, setEligible] = useState(true);
    const [title, setTitle] = useState("You're Eligible!");
    const [subtitle, setSubtitle] = useState("You are eligible for the airdrop!");
    const [allocationLabel, setAllocationLabel] = useState("Your allocation:");
    const [allocationAmount, setAllocationAmount] = useState("7,713 $LMTS");
    const [buttonText, setButtonText] = useState("Claim Now");

    const [colors, setColors] = useState({
        background: "#111111",
        card: "#181818",
        button: "#facc15",
        textPrimary: "#ffffff",
        textSecondary: "#a1a1a1",
    });

    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };

    const downloadImage = async () => {
        if (!cardRef.current) return;
        try {
            const dataUrl = await domtoimage.toPng(cardRef.current);
            const link = document.createElement("a");
            link.download = "airdrop-card.png";
            link.href = dataUrl;
            link.click();
            showToast("✅ Image downloaded successfully!");
        } catch {
            showToast("❌ Failed to download image.", "error");
        }
    };

    const copyToClipboard = async () => {
        if (!cardRef.current) return;
        try {
            const dataUrl = await domtoimage.toPng(cardRef.current);
            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            showToast("📋 Image copied to clipboard!");
        } catch {
            showToast("❌ Failed to copy image.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row items-start justify-center gap-8 p-8 relative">

            {/* === CARD PREVIEW + ACTIONS === */}
            <div className="flex flex-col items-center">
                <div
                    ref={cardRef}
                    className="w-[340px] rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center space-y-6 transition-all"
                    style={{
                        backgroundColor: colors.card,
                        color: colors.textPrimary,
                        minHeight: "420px",
                    }}
                >
                    {eligible ? (
                        <CheckCircle size={60} color="#22c55e" />
                    ) : (
                        <XCircle size={60} color="#ef4444" />
                    )}
                    <h2 className="text-2xl font-bold text-center">{title}</h2>
                    <p
                        className="text-sm text-center"
                        style={{ color: colors.textSecondary }}
                    >
                        {subtitle}
                    </p>

                    <div
                        className="rounded-xl py-3 px-4 w-full flex justify-between items-center"
                        style={{ backgroundColor: "#2a2a2a" }}
                    >
                        <span>{allocationLabel}</span>
                        <span className="font-semibold text-lg">{allocationAmount}</span>
                    </div>

                    <button
                        className="w-full font-semibold py-3 rounded-xl mt-4 transition hover:opacity-90"
                        style={{
                            backgroundColor: colors.button,
                            color: "#000",
                        }}
                    >
                        {buttonText}
                    </button>
                </div>

                {/* === ACTION BUTTONS BELOW EXPORT AREA === */}
                <div className="flex gap-3 mt-4 w-[340px]">
                    <button
                        onClick={downloadImage}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                    >
                        <Download size={16} />
                        Download
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
                    >
                        <Copy size={16} />
                        Copy
                    </button>
                </div>
            </div>

            {/* === CUSTOMIZATION PANEL === */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md w-full md:w-80">
                <h3 className="text-lg font-semibold mb-4">⚙️ Customize</h3>

                <div className="space-y-3">
                    <button
                        onClick={() => setEligible(!eligible)}
                        className={`w-full p-2 rounded font-semibold text-sm ${eligible
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                            }`}
                    >
                        {eligible ? "Switch to Not Eligible" : "Switch to Eligible"}
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Main title"
                        className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"
                    />
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Subtitle"
                        className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"
                    />
                    <input
                        type="text"
                        value={allocationLabel}
                        onChange={(e) => setAllocationLabel(e.target.value)}
                        placeholder="Allocation label"
                        className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"
                    />
                    <input
                        type="text"
                        value={allocationAmount}
                        onChange={(e) => setAllocationAmount(e.target.value)}
                        placeholder="Allocation amount"
                        className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"
                    />
                    <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Button text"
                        className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"
                    />
                </div>

                <h4 className="text-sm font-semibold mt-6 mb-2">🎨 Colors</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.keys(colors).map((key) => (
                        <div key={key} className="flex flex-col">
                            <label className="capitalize mb-1">{key}</label>
                            <input
                                type="color"
                                value={(colors as any)[key]}
                                onChange={(e) =>
                                    setColors({ ...colors, [key]: e.target.value })
                                }
                                className="h-8 rounded cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* === TOASTS === */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-md text-sm text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
