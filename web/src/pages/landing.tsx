import { Link } from "react-router-dom";
import NavBar from "../components/navbar";

function Landing() {
  return (
    <div className="min-h-screen bg-[#1e1b1c]">
      <NavBar />
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-4 pt-32 text-center">
        <p className="font-scorekeeper text-xl text-[#ef9a9a]">
          Casual cricket, properly scored
        </p>
        <h1 className="font-scorekeeper text-white text-5xl sm:text-6xl">
          {" "}
          Cricket Scorekeeper{" "}
        </h1>
        <p className="max-w-lg text-lg text-white/65">
          Create a match, share the live score, and keep every casual game on
          record.
        </p>
        <Link
          to="/create-match"
          className="rounded-full bg-[#c93434] px-7 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-[#df5050]"
        >
          Create Match
        </Link>
      </div>
    </div>
  );
}

export default Landing;
