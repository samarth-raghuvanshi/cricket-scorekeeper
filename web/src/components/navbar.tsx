
function NavBar() {
    return (
        <div className="pt-8 font-scorekeeper justify-center flex gap-16 text-white text-3xl">
            <a href="/" className="transition-colors duration-200 hover:text-[#D32F2F]">Home</a>
            <a href="/history" className="transition-colors duration-200 hover:text-[#D32F2F]">Matches</a>
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            <a href="/updates" className="transition-colors duration-200 hover:text-[#D32F2F]">Updates</a>
            <a href="/about" className="transition-colors duration-200 hover:text-[#D32F2F]">About</a>
        </div>
    );
}

export default NavBar;