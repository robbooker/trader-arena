import { useGameStore } from '../../game-engine/useGameStore';
import { formatCurrency } from '../../utils/helpers';

export function HUD() {
  const { phase, round, maxRounds, players } = useGameStore();
  const currentPlayer = players[0];

  return (
    <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
      <div className="text-lg font-bold">Trader Arena</div>
      <div className="flex gap-6 text-sm">
        <span>Phase: {phase}</span>
        <span>Round: {round}/{maxRounds}</span>
        {currentPlayer && (
          <span>Cash: {formatCurrency(currentPlayer.cash)}</span>
        )}
      </div>
    </header>
  );
}
