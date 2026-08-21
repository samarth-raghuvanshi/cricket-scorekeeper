import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import CreateMatch from "./pages/creatematch";
import MatchPage from "./pages/match";
import History from "./pages/history";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create-match" element={<CreateMatch />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
