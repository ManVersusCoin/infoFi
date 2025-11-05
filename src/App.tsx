import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
/*import Analytics from "./pages/Analytics";
import Leaderboards from "./pages/Leaderboards";
import Settings from "./pages/Settings";
import EvmActivityVisualizerPage from "./pages/EvmActivityVisualizer";
import WallChainLeaderboard from "./pages/WallchainLeaderboard";
import WallChainLeaderboard from "./pages/WallchainLeaderboard";
import XeetLeaderboard from "./pages/XeetLeaderboard";
import WallChainLeaderboard from "./pages/WallchainLeaderboard";
*/
import WallChainLeaderboard from "./pages/WallchainLeaderboard";
import XeetLeagueLeaderboard from "./pages/XeetLeagueLeaderboard";
import AirdropCardGenerator from "./pages/AirdropCardGenerator";
import CreatorEarningsCard from "./pages/CreatorEarningsCardGenerator";
import XeetPackGeneratorPage from "./pages/xeet/XeetPackGenerator";
import CryptoDadsTalker from "./pages/CryptoDadsTalker";

import "./index.css";

export default function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/pack-generator" element={<XeetPackGeneratorPage />} />
                    <Route path="/airdrop-card" element={<AirdropCardGenerator />} />
                    <Route path="/earning-card" element={<CreatorEarningsCard />} />
                    <Route path="/dad-jokes" element={<CryptoDadsTalker />} />
                    <Route path="/wallchain" element={<WallChainLeaderboard />} />
                    < Route path="/xeet-leagues" element={<XeetLeagueLeaderboard />} />
                    
                    {/*
                        <Route path="/wallchain" element={<WallChainLeaderboard />} />
                        <Route path="/wallchain" element={<WallChainLeaderboard />} />
                    < Route path="/xeet" element={<XeetLeaderboard />} />
                        < Route path="/xeet" element={<XeetLeaderboard />} />
< Route path="/nft-journey" element={<EvmActivityVisualizerPage />} />
                    <Route path="/wallchain" element={<WallChainLeaderboard />} />

                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/leaderboards" element={<Leaderboards />} />
                    <Route path="/settings" element={<Settings />} />
                    */}
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}
