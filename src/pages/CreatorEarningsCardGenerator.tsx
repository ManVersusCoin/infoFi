import { useRef, useState } from "react";
import domtoimage from "dom-to-image";
import { Calendar, Download, Copy } from "lucide-react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

export default function CreatorEarningsCard() {
    const cardRef = useRef<HTMLDivElement>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // === Dates ===
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() - 15);
    const start = new Date(end);
    start.setDate(start.getDate() - 14);

    // === States ===
    const [totalEarnings, setTotalEarnings] = useState("11012.78");
    const [payoutAmount, setPayoutAmount] = useState("");

    const downloadImage = async () => {
        if (!cardRef.current) return;
        try {
            const dataUrl = await domtoimage.toPng(cardRef.current);
            const link = document.createElement("a");
            link.download = "creator-earnings.png";
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
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            showToast("📋 Image copied to clipboard!");
        } catch {
            showToast("❌ Failed to copy image.", "error");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6 p-8 relative text-gray-900 dark:text-white transition-colors duration-300">

            {/* === PAGE HEADER === */}
            <div className="text-center max-w-md mb-4">
                <h1 className="text-3xl font-bold mb-2">Creator Earnings Card Generator</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Feeling sidelined, we got you covered! Customize your creator earnings card and flex like a KOL.
                </p>
            </div>

            {/* === CARD PREVIEW === */}
            <div
                ref={cardRef}
                className="w-[380px] rounded-2xl shadow-lg p-6 flex flex-col gap-6 transition-all bg-white dark:bg-[#000]"
            >
                {/* Header */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        X - The Everything App / X
                    </p>
                    <div className="flex gap-3 text-gray-400 dark:text-gray-500">
                        <button className="hover:text-gray-300 dark:hover:text-gray-300">ⓘ</button>
                        <button className="hover:text-gray-300 dark:hover:text-gray-300">❓</button>
                    </div>
                </div>

                {/* Earnings */}
                <div className="text-center">
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-1">Creator Earnings</p>
                    <div className="flex justify-center items-end gap-1">
                        <span className="text-4xl font-semibold">$</span>
                        <input
                            type="text"
                            value={totalEarnings}
                            onChange={(e) => setTotalEarnings(e.target.value.replace(/[^0-9.-]/g, ""))}
                            className="text-4xl font-semibold bg-transparent text-center w-40 focus:outline-none"
                        />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Total revenue</p>
                </div>

                {/* Payouts Section */}
                <div>
                    <p className="text-lg font-semibold mb-3">Payouts</p>

                    {/* Next payout */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100 dark:bg-[#161616] mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-green-500">
                                <Calendar size={20} color="#fff" />
                            </div>
                            <div>
                                <p className="font-semibold">Next payout</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(today)}</p>
                            </div>
                        </div>
                    </div>

                    {/* One past payout */}
                    <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#161616] flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-semibold">$</span>
                            <input
                                type="text"
                                placeholder="0.00"
                                value={payoutAmount}
                                onChange={(e) =>
                                    setPayoutAmount(e.target.value.replace(/[^0-9.-]/g, ""))
                                }
                                className="text-lg font-semibold bg-transparent focus:outline-none w-24"
                            />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(start)} – {formatDate(end)}
                        </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
                        This is fake, but i'm feeling sidelined
                    </p>
                </div>
            </div>

            {/* === ACTION BUTTONS === */}
            <div className="flex gap-3 w-[380px]">
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
