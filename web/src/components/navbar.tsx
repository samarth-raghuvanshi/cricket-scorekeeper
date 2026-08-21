import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 pt-6 font-scorekeeper text-2xl text-white sm:justify-center sm:text-3xl">
      <Link
        to="/"
        className="hidden transition-colors duration-200 hover:text-[#D32F2F] sm:inline"
      >
        Home
      </Link>
      <Link
        to="/history"
        className="transition-colors duration-200 hover:text-[#D32F2F]"
      >
        Matches
      </Link>
      <Link to="/" aria-label="Cricket Scorekeeper home">
        <img
          src="/logo.png"
          alt="Cricket Scorekeeper"
          className="h-9 w-9 opacity-90"
        />
      </Link>
      <Link
        to="/create-match"
        className="transition-colors duration-200 hover:text-[#D32F2F]"
      >
        Create
      </Link>
      <a
        href="#about"
        className="hidden transition-colors duration-200 hover:text-[#D32F2F] sm:inline"
      >
        About
      </a>
    </nav>
  );
}

export default NavBar;
