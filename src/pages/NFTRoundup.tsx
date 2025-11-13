import { useState, useEffect, useRef, useMemo } from 'react';
import type { JSX } from "react";
import axios from 'axios'; // <-- This requires 'npm install axios'
import {
    BarChart3, DollarSign, Users, TrendingUp, Activity, Copy, Download, Search,
    ChevronDown, Loader2,  ExternalLink
} from 'lucide-react';
import domtoimage from 'dom-to-image';

interface Collection {
    collection: string;
    name: string;
    image_url: string;
    opensea_url: string;
    project_url: string;
    contracts: { address: string; chain: string; }[];
}

interface Period {
    after: number;
    before: number;
}

interface Event {
    event_type: string;
    payment: { quantity: string; token_address: string; decimals: number; symbol: string; };
    seller: string;
    buyer: string;
    nft: { identifier: string; name: string; image_url: string; };
    event_timestamp?: number; // API sends this as an ISO 8601 String
    transaction?: string; // This is the transaction hash
}

interface NFTObject {
    identifier: string;
    name: string;
    image_url: string;
    salesCount?: number;
}

interface ProcessedData {
    totalVolume: number;
    totalAskVolume: number;
    totalBidVolume: number;
    numberOfSales: number;
    numberOfAsks: number;
    numberOfBids: number;
    askRatio: number;
    medianSalePrice: number;
    distinctBuyers: number;
    distinctSellers: number;
    balance: number;
    highestSale: Event | null;
    lowestSale: Event | null;
    mostTradedNFT: { identifier: string; name: string; image_url: string; salesCount: number } | null;
}

interface Toast {
    id: number;
    message: string;
    type: "success" | "error";
}

// --- AJOUT : Définition des chaînes (inspiré de App.jsx) ---
const chains = [
  { name: 'Ethereum', file: '/os/collection_ethereum.json', logo: 'ethereum.jpg' },
  { name: 'Abstract', file: '/os/collection_abstract.json', logo: 'abstract.jpg' }
];

// --- AJOUT : Option de collection par défaut (inspiré de App.jsx) ---
const defaultCollectionOption: Collection = { 
  collection: '', 
  name: 'Select a Collection', 
  image_url: '', 
  opensea_url: '', 
  project_url: '', 
  contracts: [] 
};


const getISOWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const NFTRoundUpPage = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [periodType, setPeriodType] = useState<'month' | 'week' | 'last'>('month');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [period, setPeriod] = useState<Period | null>(null);
    const [data, setData] = useState<ProcessedData | null>(null);
    const [previousData, setPreviousData] = useState<ProcessedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [compare, setCompare] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [fetchingCollections, setFetchingCollections] = useState(false);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const roundupRef = useRef<HTMLDivElement>(null);

    // --- NOUVEAUX ÉTATS pour la sélection de la chaîne ---
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [showChainDropdown, setShowChainDropdown] = useState(false);

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;

    // --- MODIFIÉ : useEffect dépendant de selectedChain ---
    useEffect(() => {
        setFetchingCollections(true);
        // Réinitialiser les listes et la recherche lors du changement de chaîne
        setCollections([defaultCollectionOption]);
        setFilteredCollections([defaultCollectionOption]);
        setSelectedCollection(null);
        setSearchTerm('');
        setData(null);
        setPreviousData(null);
        setAllEvents([]);

        fetch(selectedChain.file) // Utilise le fichier de la chaîne sélectionnée
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch collections from ${selectedChain.file}`);
                }
                return res.json();
            })
            .then(data => {
                setCollections([defaultCollectionOption, ...data.collections]);
                setFilteredCollections([defaultCollectionOption, ...data.collections]);
            })
            .catch(error => {
                console.error('Error fetching collections:', error);
                showToast(`❌ Failed to load collections for ${selectedChain.name}.`, "error");
                // Assurer la réinitialisation même en cas d'erreur
                setCollections([defaultCollectionOption]);
                setFilteredCollections([defaultCollectionOption]);
            })
            .finally(() => {
                setFetchingCollections(false);
            });
    }, [selectedChain]); // Se déclenche à nouveau lorsque selectedChain change

    // --- MODIFIÉ : useEffect pour filtrer les collections (inspiré de App.jsx) ---
    useEffect(() => {
        if (searchTerm === '') {
            setFilteredCollections(collections);
        } else {
            const lowerCaseSearch = searchTerm.toLowerCase();
            setFilteredCollections(
                collections.filter(c =>
                    c.name.toLowerCase().includes(lowerCaseSearch) ||
                    c.collection.toLowerCase().includes(lowerCaseSearch)
                )
            );
        }
    }, [searchTerm, collections]); // Se déclenche lorsque searchTerm ou la liste de base des collections change


    useEffect(() => {
        setCurrentPage(1);
    }, [allEvents]);

    const handleCollectionSelect = (collection: Collection) => {
        if (collection.collection === '') {
            setSelectedCollection(null);
            setSearchTerm('');
        } else {
            setSelectedCollection(collection);
            setSearchTerm(collection.name);
        }
        setShowDropdown(false);
    };

    const handlePeriodTypeChange = (value: 'month' | 'week' | 'last') => {
        setPeriodType(value);
        setSelectedPeriod('');
        setPeriod(null);
    };

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value);
        if (value === '') {
            setPeriod(null);
        } else {
            const [after, before] = value.split('_');
            setPeriod({ after: Math.floor(new Date(after).getTime() / 1000), before: Math.floor(new Date(before).getTime() / 1000) });
        }
    };
    // --- Helpers UTC ---
    const startOfDayUTC = (d: Date) => {
        const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
        return x;
    };
    const endOfDayUTC = (d: Date) => {
        const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
        return x;
    };

    // --- AJOUT : Helper pour les images (inspiré de App.jsx) ---
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        (e.target as HTMLImageElement).src = 'https://placehold.co/32x32/E0E0E0/B0B0B0?text=NFT';
    };

    // --- Months (3 derniers mois) ---
    const getMonthOptions = () => {
        const options: { value: string; label: string; display: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 3; i++) {
            const date = new Date(now);
            date.setUTCMonth(now.getUTCMonth() - i);
            const startDate = startOfDayUTC(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));

            const firstDayNextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
            const endDate = new Date(firstDayNextMonth.getTime() - 1);

            const displayFormat = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

            options.push({
                value: `${startDate.toISOString()}_${endDate.toISOString()}`,
                label: `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                display: displayFormat
            });
        }
        return options;
    };

    // --- Weeks (8 dernières semaines) ---
    const getWeekOptions = () => {
        const options: { value: string; label: string; display: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 8; i++) {
            const loopDate = new Date(now);
            loopDate.setUTCDate(now.getUTCDate() - 7 * i);

            const monday = getMonday(loopDate);
            const mondayUTCstart = startOfDayUTC(monday);
            const sundayUTCend = endOfDayUTC(new Date(mondayUTCstart.getTime() + 6 * 24 * 60 * 60 * 1000));

            const weekNum = getISOWeek(mondayUTCstart);
            const displayFormat = `${mondayUTCstart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sundayUTCend.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

            options.push({
                value: `${mondayUTCstart.toISOString()}_${sundayUTCend.toISOString()}`,
                label: `Week ${weekNum} (${mondayUTCstart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
                display: displayFormat
            });
        }
        return options;
    };

    // --- Last X days (stable via useMemo) ---

    const lastOptions = useMemo(() => {
        const now = new Date();
        return [1, 3, 7, 30, 60].map(days => {
            const before = now;
            const after = new Date(before.getTime() - days * 24 * 60 * 60 * 1000); // 24h * days
            const display = `${after.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${before.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            return {
                value: `${after.toISOString()}_${before.toISOString()}`,
                label: `Last ${days} days`,
                display
            };
        });
    }, []);
    // --- getOptions centralisé ---
    const getOptions = () => {
        if (periodType === 'month') return getMonthOptions();
        if (periodType === 'week') return getWeekOptions();
        if (periodType === 'last') return lastOptions;
        return [];
    };

    const getSelectedPeriodDisplay = () => { if (!selectedPeriod) return ''; const opt = getOptions().find(o => o.value === selectedPeriod); return opt ? opt.display : ''; };
    const getSelectedPeriodLabel = () => { if (!selectedPeriod) return 'Select a period'; const opt = getOptions().find(o => o.value === selectedPeriod); return opt ? opt.label : 'Select a period'; };

    const getPreviousPeriod = (currentPeriod: Period): Period => {
        const after = new Date(currentPeriod.after * 1000), before = new Date(currentPeriod.before * 1000);
        if (periodType === 'month') {
            const prevAfter = new Date(after);
            prevAfter.setMonth(after.getMonth() - 1);
            const prevBefore = new Date(before);
            prevBefore.setMonth(before.getMonth() - 1);
            return { after: Math.floor(prevAfter.getTime() / 1000), before: Math.floor(prevBefore.getTime() / 1000) };
        } else {
            const daysDiff = (before.getTime() - after.getTime()) / (1000 * 60 * 60 * 24);
            const prevAfter = new Date(after);
            prevAfter.setDate(after.getDate() - daysDiff);
            const prevBefore = new Date(before);
            prevBefore.setDate(before.getDate() - daysDiff);
            return { after: Math.floor(prevAfter.getTime() / 1000), before: Math.floor(prevBefore.getTime() / 1000) };
        }
    };

    const fetchAllEvents = async (collectionSlug: string, after: number, before: number): Promise<Event[]> => {
        console.log(`Starting fetch for collection: ${collectionSlug}, after: ${after}, before: ${before}`);
        let allEvents: Event[] = [];
        let cursor: string | undefined = undefined;
        let hasMore = true;

        const baseUrl = `https://api.opensea.io/api/v2/events/collection/${collectionSlug}`;
        const headers = { 'X-API-KEY': import.meta.env.VITE_OPENSEA_API_KEY };

        console.log(`API URL: ${baseUrl}`);


        while (hasMore) {
            const url = new URL(baseUrl);
            url.searchParams.append('after', String(after));
            url.searchParams.append('before', String(before));
            url.searchParams.append('event_type', 'sale');
            url.searchParams.append('limit', '200');

            if (cursor) {
                url.searchParams.append('next', cursor);
            }

            console.log(`Making request to: ${url.toString()}`);

            try {
                const response = await axios.get(url.toString(), { headers });

                console.log('API Response:', response);

                const events = (response.data.asset_events as Event[] || []).map(e => ({
                    ...e,
                   
                }));
                console.log(`Received ${events.length} events in this batch`);

                allEvents = allEvents.concat(events);

                cursor = response.data.next;
                hasMore = !!cursor;
                if (events.length === 0) {
                    hasMore = false;
                }
                console.log(`Has more data: ${hasMore}, cursor: ${cursor}`);

                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) { // 'error' is 'unknown'
                console.error("Error fetching events:", error);
                // This 'if' check *requires* axios types to be loaded.
                if (axios.isAxiosError(error)) {
                    console.error("Axios error details:", error.response?.data);
                }
                showToast("❌ Failed to fetch events from OpenSea API.", "error");
                break;
            }
        }

        console.log(`Total events fetched: ${allEvents.length}`);
        return allEvents;
    };

    const fetchData = async () => {
        if (!selectedCollection || !period) {
            showToast("⚠️ Please select a collection and a period first.", "error");
            return;
        }
        setLoading(true);
        try {
            const currentEvents = await fetchAllEvents(selectedCollection.collection, period.after, period.before);
            setAllEvents(currentEvents);

            if (currentEvents.length === 0) {
                showToast("⚠️ No sales data found for the selected period.", "error");
                setData(null);
            } else {
                const validEvents = currentEvents.filter(e => e.payment && e.payment.quantity && e.payment.decimals !== undefined);
                if (validEvents.length === 0) {
                    showToast("⚠️ No valid sales data found for the selected period.", "error");
                    setData(null);
                } else {
                    const processed = processData(validEvents);
                    setData(processed);
                }
            }

            if (compare) {
                const prev = getPreviousPeriod(period);
                const previousEvents = await fetchAllEvents(selectedCollection.collection, prev.after, prev.before);
                if (previousEvents.length > 0) {
                    const validPrev = previousEvents.filter(e => e.payment && e.payment.quantity && e.payment.decimals !== undefined);
                    setPreviousData(processData(validPrev));
                }
            } else setPreviousData(null);
        } catch (e) {
            // Safer catch block
            if (e instanceof Error) {
                console.error("Failed to fetch data:", e.message);
            } else {
                console.error("An unknown error occurred during fetch:", e);
            }
            showToast("❌ Failed to fetch data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const calculateMedian = (values: number[]) => {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const half = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2;
    };

    const findMostTradedNFT = (events: Event[]) => {
        if (!events.length) return null;
        const map: Record<string, { identifier: string, name: string, image_url: string, salesCount: number }> = {};
        events.forEach(ev => {
            const id = ev.nft.identifier;
            if (!map[id]) map[id] = { identifier: id, name: ev.nft.name, image_url: ev.nft.image_url, salesCount: 0 };
            map[id].salesCount++;
        });
        return Object.values(map).reduce((max, nft) => nft.salesCount > max.salesCount ? nft : max, Object.values(map)[0]);
    };

    const processData = (events: Event[]): ProcessedData => {

        const validEvents = events.filter(e => e.payment && e.payment.quantity && e.payment.decimals !== undefined);

        if (validEvents.length === 0) {

            return {
                totalVolume: 0,
                totalAskVolume: 0,
                totalBidVolume: 0,
                numberOfSales: 0,
                numberOfAsks: 0,
                numberOfBids: 0,
                askRatio: 0,
                medianSalePrice: 0,
                distinctBuyers: 0,
                distinctSellers: 0,
                balance: 0,
                highestSale: null,
                lowestSale: null,
                mostTradedNFT: null
            };
        }

        const totalVolume = validEvents.reduce((sum, e) => {
            if (!e.payment) return sum;
            const quantity = parseFloat(e.payment.quantity || '0');
            const decimals = e.payment.decimals || 0;
            return sum + (quantity / Math.pow(10, decimals));
        }, 0);

        const totalAskVolume = validEvents.reduce((sum, e) => {
            if (!e.payment || e.payment.symbol === 'WETH') return sum;
            const quantity = parseFloat(e.payment.quantity || '0');
            const decimals = e.payment.decimals || 0;
            return sum + (quantity / Math.pow(10, decimals));
        }, 0);

        const totalBidVolume = validEvents.reduce((sum, e) => {
            if (!e.payment || e.payment.symbol !== 'WETH') return sum;
            const quantity = parseFloat(e.payment.quantity || '0');
            const decimals = e.payment.decimals || 0;
            return sum + (quantity / Math.pow(10, decimals));
        }, 0);

        const numberOfSales = validEvents.length;
        const numberOfAsks = validEvents.filter(e => e.payment.symbol !== 'WETH').length;
        const numberOfBids = validEvents.filter(e => e.payment.symbol === 'WETH').length;
        const askRatio = totalVolume > 0 ? (totalAskVolume / totalVolume) * 100 : 0;

        const salePrices = validEvents
            .filter(e => e.payment && e.payment.quantity !== undefined && e.payment.decimals !== undefined)
            .map(e => {
                const quantity = parseFloat(e.payment.quantity);
                const decimals = e.payment.decimals;
                return quantity / Math.pow(10, decimals);
            });
        const medianSalePrice = calculateMedian(salePrices);

        const distinctBuyers = [...new Set(validEvents.map(e => e.buyer))].length;
        const distinctSellers = [...new Set(validEvents.map(e => e.seller))].length;
        const balance = distinctBuyers - distinctSellers;


        const highestSale = validEvents.length > 0
            ? validEvents.reduce((max, e) => {
                const currentValue = parseFloat(e.payment.quantity) / Math.pow(10, e.payment.decimals);
                const maxValue = parseFloat(max.payment.quantity) / Math.pow(10, max.payment.decimals);
                return currentValue > maxValue ? e : max;
            }, validEvents[0])
            : null;

        const lowestSale = validEvents.length > 0
            ? validEvents.reduce((min, e) => {
                const currentValue = parseFloat(e.payment.quantity) / Math.pow(10, e.payment.decimals);
                const minValue = parseFloat(min.payment.quantity) / Math.pow(10, min.payment.decimals);
                return currentValue < minValue ? e : min;
            }, validEvents[0])
            : null;

        const mostTradedNFT = findMostTradedNFT(validEvents);

        return {
            totalVolume,
            totalAskVolume,
            totalBidVolume,
            numberOfSales,
            numberOfAsks,
            numberOfBids,
            askRatio,
            medianSalePrice,
            distinctBuyers,
            distinctSellers,
            balance,
            highestSale,
            lowestSale,
            mostTradedNFT
        };
    };

    // --- Pagination Logic ---

    // 1. Memoize the sorted events (FIX: Use parseFloat)
    const sortedEvents = useMemo(() => {
        return [...allEvents].sort((a, b) =>
            (b.event_timestamp || 0) - (a.event_timestamp || 0)
        );
    }, [allEvents]);

    // 2. Calculate total pages
    const totalPages = Math.ceil(sortedEvents.length / rowsPerPage);

    // 3. Memoize the slice of events for the current page
    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedEvents.slice(startIndex, endIndex);
    }, [currentPage, sortedEvents]);

    // 4. Handler to change page
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const calculateChange = (current: number, prev: number) => prev === 0 ? 0 : ((current - prev) / prev) * 100;
    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };

    const copyToClipboard = async () => {
        if (!roundupRef.current) return;
        try {
            const dataUrl = await domtoimage.toPng(roundupRef.current, { cacheBust: true });
            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            showToast("📋 Image copied to clipboard!");
        } catch (e) {
            console.error("Copy failed:", e);
            showToast("❌ Failed to copy image. Browser support issue?", "error");
        }
    };

    const downloadImage = async () => {
        if (!roundupRef.current) return;
        try {
            const dataUrl = await domtoimage.toPng(roundupRef.current, { cacheBust: true });
            const link = document.createElement("a");
            link.download = `nft-roundup-${selectedCollection?.name.replace(/\s/g, '-') || 'collection'}-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
            showToast("✅ Image downloaded successfully!");
        } catch (e) {
            console.error("Download failed:", e);
            showToast("❌ Failed to download image.", "error");
        }
    };

    // This prop 'icon' needs the 'JSX.Element' type, which requires the tsconfig.json fix
    const MetricCard = ({ title, value, previousValue, change, icon, positiveOnDecrease = false }: { title: string; value: string; previousValue: string; change: number; icon: JSX.Element; positiveOnDecrease?: boolean }) => {
        const color = positiveOnDecrease ? change < 0 ? 'text-green-500' : change > 0 ? 'text-red-500' : 'text-gray-500' : change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                    {icon}
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
                {compare && (
                    <div className="flex items-center mt-2">
                        <span className={`text-sm ${color}`}>
                            {change > 0 ? <TrendingUp className="inline mr-1" size={14} /> : change < 0 ? <TrendingUp className="inline mr-1 rotate-180" size={14} /> : null}
                            {Math.abs(change).toFixed(2)}%
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs ({previousValue})</span>
                    </div>
                )}
            </div>
        );
    };

    // --- 💡 FIXED HighlightCard ---
    // This new implementation fixes the 'possibly null' errors
    const HighlightCard = ({ title, item, type }: { title: string; item: Event | NFTObject; type: 'sale' | 'traded' }) => {
        if (!item) return null;

        const isSale = type === 'sale';

        // Type guard pour TS
        const getNFTDetails = (obj: Event | NFTObject): NFTObject => {
            if ('nft' in obj) return obj.nft; // Event
            return obj; // NFTObject
        };

        const nftDetails = getNFTDetails(item);

        const saleDetails = isSale ? (item as Event) : null;

        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
                <div className="flex items-center">
                    <img
                        src={nftDetails.image_url || 'https://via.placeholder.com/64?text=NFT'}
                        alt={nftDetails.name || 'Unknown NFT'}
                        className="w-16 h-16 object-cover rounded-md mr-4"
                        onError={e => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=NFT'}
                    />
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{nftDetails.name || 'Unknown NFT'}</div>
                        {isSale && saleDetails?.payment && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {(parseFloat(saleDetails.payment.quantity) / Math.pow(10, saleDetails.payment.decimals)).toFixed(4)} {saleDetails.payment.symbol}
                            </div>
                        )}
                        {!isSale && 'salesCount' in nftDetails && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {nftDetails.salesCount} sales
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">NFT Collection Roundup</h1>

               

                <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6">
                <div className="relative md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Chain
                        </label>
                        <button
                            onClick={() => setShowChainDropdown(!showChainDropdown)}
                            onBlur={() => setTimeout(() => setShowChainDropdown(false), 200)} // Délai pour permettre le clic sur onMouseDown
                            className="flex items-center justify-between w-full p-2.5 pl-3 pr-4 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <img
                                    src={selectedChain.logo}
                                    alt={selectedChain.name}
                                    className="w-6 h-6 rounded-full"
                                    onError={handleImageError}
                                />
                                <span className="font-medium">{selectedChain.name}</span>
                            </div>
                            <ChevronDown size={18} className={`transition-transform text-gray-400 ${showChainDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showChainDropdown && (
                            <div className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {chains.map(chain => (
                                    <div
                                        key={chain.name}
                                        className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer gap-2"
                                        onMouseDown={() => { // onMouseDown se déclenche avant onBlur
                                            setSelectedChain(chain);
                                            setShowChainDropdown(false);
                                        }}
                                    >
                                        <img
                                            src={chain.logo}
                                            alt={chain.name}
                                            className="w-6 h-6 rounded-full"
                                            onError={handleImageError}
                                        />
                                        <span className="text-gray-900 dark:text-white">{chain.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>    
                <div className="relative  md:col-span-3">
                        
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Collection
                        </label>
                        <Search className="absolute left-3 top-10 text-gray-400" size={18} /> 
                        <input
                            type="text"
                            value={searchTerm}
                            placeholder="Search collections..."
                            onChange={e => setSearchTerm(e.target.value)}
                            onFocus={(e) => { e.target.select(); setShowDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                            className="w-full p-2.5 pl-10 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        {fetchingCollections && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-700/70 rounded-md">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            </div>
                        )}
                        {showDropdown && !fetchingCollections && filteredCollections.filter(c => c.collection !== '').length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredCollections.filter(c => c.collection !== '').map(c =>
                                    <div
                                        key={c.collection}
                                        className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                        onMouseDown={() => handleCollectionSelect(c)}
                                    >
                                        <img
                                            src={c.image_url}
                                            onError={e => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=NFT'}
                                            className="w-8 h-8 rounded-full mr-3"
                                            alt={c.name}
                                        />
                                        <span className="text-gray-900 dark:text-white">{c.name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {showDropdown && !fetchingCollections && filteredCollections.filter(c => c.collection !== '').length === 0 && searchTerm.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 text-gray-500 dark:text-gray-400">
                                No collections found.
                            </div>
                        )}
                    </div>

                    <div className=" md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:col-span-2">
                            Period
                        </label>
                        <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-700 p-1 h-12">
                            <button
                                type="button"
                                className={`w-full h-full  px-4 rounded-md text-sm font-medium transition-colors ${periodType === 'month'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                onClick={() => handlePeriodTypeChange('month')}
                            >
                                Month
                            </button>
                            <button
                                type="button"
                                className={`w-full h-full  px-4 rounded-md text-sm font-medium transition-colors ${periodType === 'week'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                onClick={() => handlePeriodTypeChange('week')}
                            >
                                Week
                            </button>
                            <button
                                type="button"
                                className={`w-full h-full  px-4 rounded-md text-sm font-medium transition-colors ${periodType === 'last'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                onClick={() => handlePeriodTypeChange('last')}
                            >
                                Last
                            </button>
                        </div>


                        <div className="relative">
                            
                            
                            <button
                                type="button"
                                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                                onBlur={() => setTimeout(() => setIsPeriodDropdownOpen(false), 150)}
                                className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-white text-gray-900 flex justify-between items-center text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <span className={selectedPeriod ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                                    {getSelectedPeriodLabel()}
                                </span>
                                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPeriodDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {getOptions().map(opt => (
                                        <div
                                            key={opt.value}
                                            className={`p-3 cursor-pointer ${selectedPeriod === opt.value ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'} text-gray-900 dark:text-white`}
                                            onMouseDown={() => {
                                                handlePeriodChange(opt.value);
                                                setIsPeriodDropdownOpen(false);
                                            }}
                                        >
                                            <div className="font-medium">{opt.label}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{opt.display}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center mb-6">
                    <label htmlFor="compare-toggle" className="flex items-center cursor-pointer">
                        <span className="mr-3 text-gray-700 dark:text-gray-300">Compare with Previous Period</span>
                        <div className="relative">
                            <input
                                id="compare-toggle"
                                type="checkbox"
                                className="sr-only"
                                checked={compare}
                                onChange={e => setCompare(e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${compare ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${compare ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end mb-6">
                    <button
                        onClick={fetchData}
                        disabled={loading || !selectedCollection?.collection || !selectedPeriod}
                        className={`px-4 py-2 rounded-md flex items-center transition-colors ${loading || !selectedCollection?.collection || !selectedPeriod ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating Roundup...
                            </>
                        ) : (
                            'Generate Roundup'
                        )}
                    </button>
                </div>

                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-blue-600 font-medium">Fetching Data (this may take a moment)...</span>
                        </div>
                    )}

                    {(data || loading) && (
                        <div ref={roundupRef} className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg transition-all duration-300 ${loading ? 'blur-sm pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-center">
                                {selectedCollection && selectedCollection.collection !== '' && (
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={selectedCollection.image_url}
                                            alt={selectedCollection.name}
                                            className="w-20 h-20 rounded-lg object-cover"
                                            onError={e => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=NFT'}
                                        />
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCollection.name}</h2>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Analysis Period</h2>
                                    <p className="text-blue-900 dark:text-blue-100 font-semibold">{getSelectedPeriodLabel()}</p>
                                    <p className="text-blue-700 dark:text-blue-300 font-medium">{getSelectedPeriodDisplay()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                {data && (
                                    <>
                                        <MetricCard title="Total Volume" value={`${data.totalVolume.toFixed(2)} ETH`} previousValue={`${previousData?.totalVolume.toFixed(2) || '0'} ETH`} change={calculateChange(data.totalVolume, previousData?.totalVolume || 0)} icon={<BarChart3 size={18} />} />
                                        <MetricCard title="Ask Volume" value={`${data.totalAskVolume.toFixed(2)} ETH`} previousValue={`${previousData?.totalAskVolume.toFixed(2) || '0'} ETH`} change={calculateChange(data.totalAskVolume, previousData?.totalAskVolume || 0)} icon={<DollarSign size={18} />} />
                                        <MetricCard title="Bid Volume" value={`${data.totalBidVolume.toFixed(2)} ETH`} previousValue={`${previousData?.totalBidVolume.toFixed(2) || '0'} ETH`} change={calculateChange(data.totalBidVolume, previousData?.totalBidVolume || 0)} icon={<DollarSign size={18} />} positiveOnDecrease />
                                        <MetricCard title="Number of Sales" value={data.numberOfSales.toString()} previousValue={previousData?.numberOfSales.toString() || '0'} change={calculateChange(data.numberOfSales, previousData?.numberOfSales || 0)} icon={<Activity size={18} />} />
                                        <MetricCard title="Ask Volume Ratio" value={`${data.askRatio.toFixed(2)}%`} previousValue={`${previousData?.askRatio.toFixed(2) || '0'}%`} change={calculateChange(data.askRatio, previousData?.askRatio || 0)} icon={<TrendingUp size={18} />} />
                                        <MetricCard title="Median Sale Price" value={`${data.medianSalePrice.toFixed(3)} ETH`} previousValue={`${previousData?.medianSalePrice.toFixed(3) || '0'} ETH`} change={calculateChange(data.medianSalePrice, previousData?.medianSalePrice || 0)} icon={<DollarSign size={18} />} />
                                        <MetricCard title="Distinct Buyers" value={data.distinctBuyers.toString()} previousValue={previousData?.distinctBuyers.toString() || '0'} change={calculateChange(data.distinctBuyers, previousData?.distinctBuyers || 0)} icon={<Users size={18} />} />
                                        <MetricCard title="Distinct Sellers" value={data.distinctSellers.toString()} previousValue={previousData?.distinctSellers.toString() || '0'} change={calculateChange(data.distinctSellers, previousData?.distinctSellers || 0)} icon={<Users size={18} />} positiveOnDecrease />
                                        <MetricCard title="Buyer-Seller Balance" value={data.balance.toString()} previousValue={`${previousData?.balance || 0}`} change={calculateChange(data.balance, previousData?.balance || 0)} icon={<TrendingUp size={18} />} positiveOnDecrease />
                                    </>
                                )}
                            </div>

                            {data && (
                                <div className="mb-6">
                                    <h4 className="text-md font-medium mb-3 flex items-center text-gray-600 dark:text-gray-300">
                                        <TrendingUp size={16} className="mr-2" />Highlights
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <HighlightCard title="Highest Sale" item={data.highestSale!} type="sale" />
                                        <HighlightCard title="Lowest Sale" item={data.lowestSale!} type="sale" />
                                        <HighlightCard title="Most Traded NFT" item={data.mostTradedNFT!} type="traded" />
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                <p>Data from @opensea API</p>
                                <a href="https://web3wut.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-500">
                                    <span className="mr-2">Generated by WUT - **web3wut.vercel.app**</span>
                                    <img src="/logo.png" alt="WUT Logo" className="w-5 h-5" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {data && (
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={copyToClipboard} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center transition-colors">
                            <Copy size={16} className="mr-2" />Copy to Clipboard
                        </button>
                        <button onClick={downloadImage} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center transition-colors">
                            <Download size={16} className="mr-2" />Download as PNG
                        </button>
                    </div>
                )}

                {/* --- Accordion and Paginated Table --- */}
                {allEvents.length > 0 && (
                    <div className="mt-12">
                        {/* Accordion Toggle Header */}
                        <button
                            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                            className="w-full flex justify-between items-center text-left text-xl font-semibold text-gray-900 dark:text-white mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-expanded={isDetailsOpen}
                        >
                            <span>
                                Details — {allEvents.length} Sales in Selected Period
                            </span>
                            <ChevronDown
                                size={20}
                                className={`transition-transform duration-200 ${isDetailsOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* Collapsible Content */}
                        {isDetailsOpen && (
                            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">NFT</th>
                                                <th className="px-4 py-2 text-left">Buyer</th>
                                                <th className="px-4 py-2 text-left">Seller</th>
                                                <th className="px-4 py-2 text-left">Price</th>
                                                <th className="px-4 py-2 text-left">Transaction</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                            {paginatedEvents.map((ev, i) => (
                                                <tr key={`${ev.transaction || i}-${ev.nft.identifier}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                        {/* --- 💡 FIX: Use parseFloat for safety --- */}
                                                        {ev.event_timestamp
                                                            ? new Date(parseFloat(ev.event_timestamp.toFixed(0)) * 1000).toLocaleString()
                                                            : "—"}
                                                    </td>
                                                    <td className="px-4 py-2 flex items-center space-x-2">
                                                        <img
                                                            src={ev.nft.image_url}
                                                            onError={e => (e.currentTarget.src = "https://via.placeholder.com/40?text=NFT")}
                                                            alt={ev.nft.name}
                                                            className="w-10 h-10 rounded object-cover"
                                                        />
                                                        <span className="text-gray-900 dark:text-white">{ev.nft.name || ev.nft.identifier}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{ev.buyer}</td>
                                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{ev.seller}</td>
                                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                                                        {(parseFloat(ev.payment?.quantity) / Math.pow(10, ev.payment?.decimals)).toFixed(4)} {ev.payment?.symbol}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                                        {ev.transaction ? (
                                                            <a
                                                                href={`https://etherscan.io/tx/${ev.transaction}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline flex items-center"
                                                            >
                                                                View Tx <ExternalLink size={14} className="ml-1" />
                                                            </a>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-sm text-gray-700 dark:text-gray-400">
                                            Showing {paginatedEvents.length} of {sortedEvents.length} results
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-gray-700 dark:text-gray-400">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {toasts.map(toast => (
                    <div key={toast.id} className={`fixed bottom-4 right-4 p-3 rounded-md shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NFTRoundUpPage;