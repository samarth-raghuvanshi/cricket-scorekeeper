import NavBar from "../components/navbar";
function Landing() {
    return (
        <div className = "min-h-screen bg-[#1E1E1E]">
            <NavBar />
            <div className = "pt-16 flex flex-col items-center justify-center">
                <h1 className = "font-scorekeeper text-white text-6xl"> Cricket Scorekeeper </h1>
            </div>
        </div>
    );
}

export default Landing;