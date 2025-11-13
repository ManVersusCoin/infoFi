import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Users, Shield, Crown, ChevronDown, Search, ArrowUp, ArrowDown } from 'lucide-react';

// Interface for the raw JSON data
interface HolderData {
  armyCount: number;
  ogCount: number;
  oneOfOneCount: number;
  armyPoints: number;
  ogPoints: number;
  totalPoints: number; // This is the old total, we will recalculate
  nftIds: string[];
}

interface ScoreData {
  lastFetched: number;
  scores: {
    [address: string]: HolderData;
  };
}

// NEW: Interface for a single simulation's breakdown
interface SimBreakdown {
  elders: number;
  representatives: number;
  members: number;
}

// UPDATED: Interface for our processed holder data (for stats AND table)
interface ProcessedHolder {
  address: string;
  totalPoints: number;
  armyCount: number;
  ogCount: number;
  oneOfOneCount: number;
  nftCount: number;
  // NEW: Store simulation results per holder
  simRarity: SimBreakdown;
  simBalanced: SimBreakdown;
  simSupply: SimBreakdown;
}

// Interface for a single simulation's outcome
interface SimulationResult {
  maxPotentialSupply: SimBreakdown;
  finalCappedSupply: SimBreakdown;
}

// Interface for all calculated stats
interface CalculatedStats {
  // Global figures
  totalHolders: number;
  totalPointsInSystem: number;
  totalOneOfOneHolders: number;
  totalOneOfOneNFTs: number; // NEW
  totalNftSupply: number; // NEW

  // Simple eligibility (how many wallets)
  eligibleHolders: {
    member: number;
    representative: number;
    elder: number;
  };
  
  // NEW: Wallets with < 3 points
  nonEligibleHolders: {
    points1: number;
    points2: number;
  };

  // Contains all three simulation results
  simulations: {
    rarityOptimized: SimulationResult;
    balanced: SimulationResult;
    supplyOptimized: SimulationResult;
  };
}

// Type for sorting configuration
type SortConfig = {
  key: keyof ProcessedHolder;
  direction: 'asc' | 'desc';
} | null;

const ExodusStatsCalculator = () => {
  const [stats, setStats] = useState<CalculatedStats | null>(null);
  const [allHolders, setAllHolders] = useState<ProcessedHolder[]>([]); // For the table
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Table State ---
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalPoints', direction: 'desc' });
  const rowsPerPage = 20;

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        setLoading(true);
        // --- UPDATED FILE PATH ---
        const response = await fetch('/misc/exodus.json'); 
        if (!response.ok) {
          throw new Error('Failed to fetch progress.json');
        }
        const data: ScoreData = await response.json();

        // --- TASK 1: Exclude dead address ---
        const deadAddress = "0x000000000000000000000000000000000000dead";

        // --- 1. Process Data ---
        const processedHolders: ProcessedHolder[] = Object.keys(data.scores)
          .filter(address => address.toLowerCase() !== deadAddress) // Filter out dead address
          .map(address => {
            const wallet = data.scores[address];
            
            // RULES: 1 pt/Army, 3 pts/OG
            // --- FIX: Add fallbacks for potentially undefined counts ---
            const points = ((wallet.armyCount || 0) * 1) + ((wallet.ogCount || 0) * 3);
            const oneOfOnes = wallet.oneOfOneCount || 0;

            // --- TASK 2: Calculate per-holder simulations ---

            // Sim 1: Rarity-Optimized (E > R > M)
            let r_points = points;
            const r_elders_1o1 = oneOfOnes; // 1-of-1s cost 0 points
            const r_elders_pts = Math.floor(r_points / 15);
            r_points -= r_elders_pts * 15;
            const r_reps = Math.floor(r_points / 7);
            r_points -= r_reps * 7;
            const r_members = Math.floor(r_points / 3);
            const simRarity: SimBreakdown = {
              elders: r_elders_1o1 + r_elders_pts,
              representatives: r_reps,
              members: r_members
            };

            // Sim 2: Balanced (R > M)
            let b_points = points;
            const b_reps = Math.floor(b_points / 7);
            b_points -= b_reps * 7;
            const b_members = Math.floor(b_points / 3);
            const simBalanced: SimBreakdown = {
              elders: 0, // This sim ignores elders
              representatives: b_reps,
              members: b_members
            };
            
            // Sim 3: Supply-Optimized (M only)
            let s_points = points;
            const s_members = Math.floor(s_points / 3);
            const simSupply: SimBreakdown = {
              elders: 0,
              representatives: 0,
              members: s_members
            };
            
            return {
              address,
              totalPoints: points,
              armyCount: wallet.armyCount || 0,
              ogCount: wallet.ogCount || 0,
              oneOfOneCount: oneOfOnes,
              nftCount: (wallet.nftIds || []).length || 0, // --- FIX: Add fallback for nftIds ---
              simRarity, // Store the result
              simBalanced,
              simSupply
            };
          });
        
        // --- 2. Store data for table and stats ---
        setAllHolders(processedHolders); // Set full list for table
        setStats(calculateAllStats(processedHolders)); // Calculate stats

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []); // Runs once on mount

  /**
   * Applies global supply caps (100 Elders, 1000 Reps) to a set of potential mints.
   * This logic now just caps the *summed totals* from the per-holder simulations.
   */
  const applyCaps = (potential: SimBreakdown): SimBreakdown => {
    const elders = Math.min(potential.elders, 100);
    const representatives = Math.min(potential.representatives, 1000);
    const members = potential.members; // No cap
    return { elders, representatives, members };
  };

  /**
   * Calculates all global, eligibility, and simulation stats from processed holder data.
   */
  const calculateAllStats = (holders: ProcessedHolder[]): CalculatedStats => {
    
    // --- A. Global Figures ---
    const totalHolders = holders.length;
    const totalPointsInSystem = holders.reduce((sum, h) => sum + h.totalPoints, 0);
    const totalOneOfOneHolders = holders.filter(h => h.oneOfOneCount > 0).length;
    const totalOneOfOneNFTs = holders.reduce((sum, h) => sum + h.oneOfOneCount, 0); // NEW
    const totalNftSupply = holders.reduce((sum, h) => sum + h.nftCount, 0); // NEW

    // --- B. Eligibility Figures ---
    const eligibleHolders = {
      member: holders.filter(h => h.totalPoints >= 3).length,
      representative: holders.filter(h => h.totalPoints >= 7).length,
      elder: holders.filter(h => h.totalPoints >= 15 || h.oneOfOneCount > 0).length,
    };
    
    // NEW: Non-Eligible
    const nonEligibleHolders = {
      points1: holders.filter(h => h.totalPoints === 1).length,
      points2: holders.filter(h => h.totalPoints === 2).length,
    };

    // --- C. Sum All 3 Simulations (Potential Supply) ---
    // Sum the pre-calculated results from each holder
    
    const rarityPotential = holders.reduce((sum, h) => {
      sum.elders += h.simRarity.elders;
      sum.representatives += h.simRarity.representatives;
      sum.members += h.simRarity.members;
      return sum;
    }, { elders: 0, representatives: 0, members: 0 });
    
    const balancedPotential = holders.reduce((sum, h) => {
      sum.elders += h.simBalanced.elders; // 0
      sum.representatives += h.simBalanced.representatives;
      sum.members += h.simBalanced.members;
      return sum;
    }, { elders: 0, representatives: 0, members: 0 });
    
    const supplyPotential = holders.reduce((sum, h) => {
      sum.elders += h.simSupply.elders; // 0
      sum.representatives += h.simSupply.representatives; // 0
      sum.members += h.simSupply.members;
      return sum;
    }, { elders: 0, representatives: 0, members: 0 });


    // --- D. Package Results ---
    const rarityCapped = applyCaps(rarityPotential);
    const balancedCapped = applyCaps(balancedPotential);
    const supplyCapped = applyCaps(supplyPotential);
    
    return {
      totalHolders,
      totalPointsInSystem,
      totalOneOfOneHolders,
      totalOneOfOneNFTs,
      totalNftSupply,
      eligibleHolders,
      nonEligibleHolders,
      simulations: {
        rarityOptimized: { maxPotentialSupply: rarityPotential, finalCappedSupply: rarityCapped },
        balanced: { maxPotentialSupply: balancedPotential, finalCappedSupply: balancedCapped },
        supplyOptimized: { maxPotentialSupply: supplyPotential, finalCappedSupply: supplyCapped }
      }
    };
  };

  // --- Table Logic ---

  const handleSort = (key: keyof ProcessedHolder) => {
    let direction: 'asc' | 'desc' = 'desc'; // Default to desc
    if (key === 'address') direction = 'asc'; // Default to asc for addresses

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };
  
  // 1. Sort
  const sortedHolders = useMemo(() => {
    let sortableHolders = [...allHolders];
    if (sortConfig !== null) {
      sortableHolders.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableHolders;
  }, [allHolders, sortConfig]);

  // 2. Filter (Search)
  const filteredHolders = useMemo(() => {
    return sortedHolders.filter(holder => 
      holder.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedHolders, searchTerm]);
  
  // 3. Paginate
  const paginatedHolders = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredHolders.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHolders, currentPage]);

  const totalPages = Math.ceil(filteredHolders.length / rowsPerPage);
  
  const getSortIcon = (key: keyof ProcessedHolder) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="w-4 h-4 opacity-30"><ArrowUp /></span>; // Placeholder
    }
    return sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />;
  };

  // --- Helper component for rendering simulation breakdown in table ---
  const SimBreakdownCell = ({ sim }: { sim: SimBreakdown }) => {
    // --- FIX: Add a guard clause for undefined sim prop ---
    if (!sim) {
      return <span className="text-gray-500">?</span>;
    }
    const hasMints = sim.elders > 0 || sim.representatives > 0 || sim.members > 0;
    return (
      <div className="flex flex-col text-xs text-left">
        {sim.elders > 0 && <span className="text-yellow-400">E: {sim.elders}</span>}
        {sim.representatives > 0 && <span className="text-blue-400">R: {sim.representatives}</span>}
        {sim.members > 0 && <span className="text-green-400">M: {sim.members}</span>}
        {!hasMints && (
          <span className="text-gray-500">-</span>
        )}
      </div>
    );
  };

  // --- Component Rendering ---

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Calculating possibilities...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="p-8 text-gray-500">No data found.</div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">🐸 Plague Exodus Stats</h1>

      {/* --- Section 1: Global Data --- */}
      <h2 className="text-xl font-semibold mb-3">Global Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Unique Holders" value={stats.totalHolders.toLocaleString()} />
        <StatCard title="Total NFT Supply" value={stats.totalNftSupply.toLocaleString()} />
        <StatCard title="Total Points (Army+OG)" value={stats.totalPointsInSystem.toLocaleString()} />
        <StatCard title="1-of-1 Holders" value={stats.totalOneOfOneHolders.toLocaleString()} />
        <StatCard title="Total 1-of-1 NFTs" value={stats.totalOneOfOneNFTs.toLocaleString()} />
      </div>

      {/* --- Section 2: Eligibility --- */}
      <h2 className="text-xl font-semibold mb-3">Wallet Eligibility</h2>
      <p className="text-sm text-gray-400 mb-4">
        Wallet counts based on their total points.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard 
          title="Eligible (Member)" 
          value={`${stats.eligibleHolders.member.toLocaleString()}`} 
          subtitle=">= 3 points"
          Icon={Users}
        />
        <StatCard 
          title="Eligible (Rep)" 
          value={`${stats.eligibleHolders.representative.toLocaleString()}`} 
          subtitle=">= 7 points"
          Icon={Shield}
        />
        <StatCard 
          title="Eligible (Elder)" 
          value={`${stats.eligibleHolders.elder.toLocaleString()}`} 
          subtitle=">= 15 points OR 1-of-1"
          Icon={Crown}
        />
        <StatCard 
          title="Ineligible (1 Point)" 
          value={`${stats.nonEligibleHolders.points1.toLocaleString()}`} 
          subtitle="< 3 points"
        />
        <StatCard 
          title="Ineligible (2 Points)" 
          value={`${stats.nonEligibleHolders.points2.toLocaleString()}`} 
          subtitle="< 3 points"
        />
      </div>

      {/* --- Section 3: Maximum Supply (Simulations) --- */}
      <h2 className="text-xl font-semibold mb-3">Maximum Supply Simulations</h2>
      <p className="text-sm text-gray-400 mb-4">
        Simulations based on different holder strategies, applying supply caps (100 Elders, 1000 Reps).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimulationCard 
          title="Rarity Optimized"
          subtitle="Priority: Elder > Rep > Member"
          stats={stats.simulations.rarityOptimized.finalCappedSupply}
        />
        <SimulationCard 
          title="Balanced"
          subtitle="Priority: Rep > Member"
          stats={stats.simulations.balanced.finalCappedSupply}
        />
        <SimulationCard 
          title="Supply Optimized"
          subtitle="Priority: Member Only"
          stats={stats.simulations.supplyOptimized.finalCappedSupply}
        />
      </div>
      
      {/* --- NEW: Accordion Table --- */}
      <div className="mt-12">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex justify-between items-center text-left text-xl font-semibold text-gray-200 mb-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none"
        >
          <span>
            Holder Data ({allHolders.length} wallets)
          </span>
          <ChevronDown
            size={20}
            className={`transition-transform duration-200 ${isDetailsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDetailsOpen && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Search by wallet address..."
                className="w-full p-2 pl-10 border rounded-lg bg-gray-700 text-white border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('address')}>
                      <span className="flex items-center gap-1">Address {getSortIcon('address')}</span>
                    </th>
                    <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('totalPoints')}>
                      <span className="flex items-center gap-1">Total Points {getSortIcon('totalPoints')}</span>
                    </th>
                    <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('nftCount')}>
                      <span className="flex items-center gap-1">NFTs {getSortIcon('nftCount')}</span>
                    </th>
                    <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('oneOfOneCount')}>
                      <span className="flex items-center gap-1">1-of-1s {getSortIcon('oneOfOneCount')}</span>
                    </th>
                    <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('ogCount')}>
                      <span className="flex items-center gap-1">OGs {getSortIcon('ogCount')}</span>
                    </th>
                    <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('armyCount')}>
                      <span className="flex items-center gap-1">Army {getSortIcon('armyCount')}</span>
                    </th>
                    {/* --- NEW TABLE HEADERS --- */}
                    <th className="px-4 py-2 text-left">Rarity Optimized</th>
                    <th className="px-4 py-2 text-left">Balanced</th>
                    <th className="px-4 py-2 text-left">Supply Optimized</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {paginatedHolders.map((holder) => (
                    <tr key={holder.address} className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 text-gray-300 truncate max-w-xs">{holder.address}</td>
                      <td className="px-4 py-2 text-white font-medium">{holder.totalPoints}</td>
                      <td className="px-4 py-2 text-gray-300">{holder.nftCount}</td>
                      <td className="px-4 py-2 text-gray-300">{holder.oneOfOneCount}</td>
                      <td className="px-4 py-2 text-gray-300">{holder.ogCount}</td>
                      <td className="px-4 py-2 text-gray-300">{holder.armyCount}</td>
                      {/* --- NEW TABLE CELLS --- */}
                      <td className="px-4 py-2">
                        <SimBreakdownCell sim={holder.simRarity} />
                      </td>
                      <td className="px-4 py-2">
                        <SimBreakdownCell sim={holder.simBalanced} />
                      </td>
                      <td className="px-4 py-2">
                        <SimBreakdownCell sim={holder.simSupply} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 mt-2">
              <span className="text-sm text-gray-400">
                Showing {paginatedHolders.length} of {filteredHolders.length} results
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium rounded-md border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium rounded-md border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// --- Simple UI Card for global stats ---
const StatCard = ({ title, value, subtitle, Icon }: {
  title: string;
  value: string;
  subtitle?: string;
  Icon?: React.ElementType;
}) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow h-full">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      {Icon && <Icon className="w-5 h-5 text-gray-500" />}
    </div>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

// --- New UI Card for simulation results ---
const SimulationCard = ({ title, subtitle, stats }: { 
  title: string, 
  subtitle: string, 
  stats: SimulationResult['finalCappedSupply'] 
}) => (
  <div className="bg-gray-800 p-4 rounded-lg flex flex-col shadow-lg">
    <h3 className="text-lg font-bold">{title}</h3>
    <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
    <div className="space-y-2 flex-grow">
      <div className="flex justify-between items-center">
        <span className="font-medium text-yellow-400 flex items-center"><Crown className="w-4 h-4 mr-1.5" />Elders</span>
        <span className="font-bold text-xl text-white">{stats.elders.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-blue-400 flex items-center"><Shield className="w-4 h-4 mr-1.5" />Representatives</span>
        <span className="font-bold text-xl text-white">{stats.representatives.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-green-400 flex items-center"><Users className="w-4 h-4 mr-1.5" />Members</span>
        <span className="font-bold text-xl text-white">{stats.members.toLocaleString()}</span>
      </div>
    </div>
  </div>
);

export default ExodusStatsCalculator;