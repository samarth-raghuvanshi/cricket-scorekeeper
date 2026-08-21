import { Link } from "react-router-dom";
import NavBar from "../components/navbar";

function Landing() {
  return (
    <div className="min-h-screen bg-[#1e1b1c]">
      <NavBar />
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-4 pt-32 text-center">
        <p className="font-scorekeeper text-xl text-[#ef9a9a]">
          Simple and hassle-free scoring
        </p>
        <h1 className="font-scorekeeper text-white text-5xl sm:text-6xl">
          {" "}
          Cricket Scorekeeper{" "}
        </h1>
        <p className="max-w-lg text-lg text-white/65">
          Create, watch, score and share live matches with friends
        </p>
        <Link
          to="/create-match"
          className="rounded-lg bg-[#c93434] px-7 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-[#df5050]"
        >
          Start a Match
        </Link>
        <Link
          to="/history"
          className="rounded-lg bg-transparent px-7 py-3 text-lg font-semibold text-white border-1 border-white/8 transition-colors hover:bg-[#df5050]"
        >
          View Matches
        </Link>
      </div>
    </div>
  );
}

export default Landing;
