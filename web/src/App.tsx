import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import CreateMatch from "./pages/creatematch";
import MatchPage from "./pages/match";
import History from "./pages/history";
import About from "./pages/about";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create-match" element={<CreateMatch />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
