import type { ScoringEvent } from "../lib/scoring";

function ScoringControls({
  activeBatterName,
  disabled,
  undoDisabled,
  onScore,
  onUndo,
}: {
  activeBatterName?: string;
  disabled: boolean;
  undoDisabled: boolean;
  onScore: (event: ScoringEvent, runs?: number) => void;
  onUndo: () => void;
}) {
  return (
    <section className="mt-7 text-center">
      <p className="mb-3 text-white/65">
        Scoring: <strong>{activeBatterName ?? "select next batter"}</strong>
      </p>
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 6].map((runs) => (
          <button
            key={runs}
            onClick={() => onScore("runs", runs)}
            disabled={disabled}
            className="h-12 rounded-full bg-white/10 font-bold hover:bg-[#c93434] disabled:opacity-35"
          >
            {runs}
          </button>
        ))}
        <div className="col-span-3 flex justify-center gap-2">
          <button
            onClick={() => onScore("wide")}
            disabled={disabled}
            className="h-12 w-full max-w-[calc((100%-0.5rem)/3)] rounded-full bg-white/10 font-semibold hover:bg-[#c93434] disabled:opacity-35"
          >
            Wide
          </button>
          <button
            onClick={() => onScore("noball")}
            disabled={disabled}
            className="h-12 w-full max-w-[calc((100%-0.5rem)/3)] rounded-full bg-white/10 font-semibold hover:bg-[#c93434] disabled:opacity-35"
          >
            NB
          </button>
        </div>
        <button
          onClick={() => onScore("wicket")}
          disabled={disabled}
          className="col-span-3 h-12 rounded-full bg-[#b72d2d] font-semibold hover:bg-[#d84848] disabled:opacity-35"
        >
          Wicket
        </button>
        <button
          onClick={onUndo}
          disabled={undoDisabled}
          className="col-span-3 h-11 rounded-full border border-white/20 bg-white/[0.06] font-semibold text-white/80 hover:border-[#ef9a9a] hover:bg-white/10 disabled:opacity-35"
        >
          Undo last delivery
        </button>
      </div>
    </section>
  );
}

export default ScoringControls;
