import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
/*import Analytics from "./pages/Analytics";
import Leaderboards from "./pages/Leaderboards";
import Settings from "./pages/Settings";
import XeetLeaderboard from "./pages/XeetLeaderboard";
import WallChainLeaderboard from "./pages/WallchainLeaderboard";
*/
import AirdropCardGenerator from "./pages/AirdropCardGenerator";
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
                    <Route path="/dad-jokes" element={<CryptoDadsTalker />} />
                    {/*
                    < Route path="/xeet" element={<XeetLeaderboard />} />
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
