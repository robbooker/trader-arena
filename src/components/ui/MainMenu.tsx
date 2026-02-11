export function MainMenu() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">Trader Arena</h1>
      <p className="text-slate-400">Compete. Trade. Dominate the market.</p>
      <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors">
        Start Game
      </button>
    </div>
  );
}
