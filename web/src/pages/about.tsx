import NavBar from "../components/navbar";

const roadmap = [
  {
    title: "Tournament mode",
    detail: "Organize fixtures & standings in one place",
  },
  {
    title: "Player statistics",
    detail: "Track career highlights across matches",
  },
  {
    title: "Wagon wheel",
    detail: "See the direction of every scoring shot",
  }
];

function About() {
  return (
    <div className="min-h-screen bg-[#1e1b1c] text-white">
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-center font-scorekeeper py-3 text-lg text-[#ef9a9a]">
          About the project
        </p>
        <h1 className="mb-8 text-center text-4xl font-scorekeeper text-white">
          Scorekeeper
        </h1>

        <section className="mt-14 rounded-lg border border-white/15 bg-white/[0.04] p-6 shadow-xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#ef9a9a]">
            Roadmap
          </p>
          <h2 className="mt-2 font-scorekeeper text-3xl">In the plans</h2>
          <div className="mt-6 divide-y divide-white/10">
            {roadmap.map((item) => (
              <article key={item.title} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-1 text-white/60">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default About;
