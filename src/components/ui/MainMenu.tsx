import { useState } from 'react';
import { useGameStore } from '../../game-engine/useGameStore';
import { STARTING_CASH } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

interface MainMenuProps {
  onStart: (playerId: string) => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  const [name, setName] = useState('');
  const addPlayer = useGameStore((s) => s.addPlayer);
  const initGame = useGameStore((s) => s.initGame);
  const startTrading = useGameStore((s) => s.startTrading);
  const round = useGameStore((s) => s.round);
  const maxRounds = useGameStore((s) => s.maxRounds);

  const handleStart = () => {
    const playerName = name.trim() || 'Trader';
    initGame();
    const player = addPlayer(playerName);
    startTrading();
    onStart(player.id);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e17] select-none">
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[#00ff88] font-bold text-4xl tracking-wider font-mono">
              TRADER
            </span>
            <span className="text-amber-400 font-bold text-4xl tracking-wider font-mono">
              ARENA
            </span>
          </div>
          <p className="text-slate-500 text-sm font-mono tracking-wider">
            COMPETE. TRADE. DOMINATE THE MARKET.
          </p>
        </div>

        {/* Game info */}
        <div className="w-full bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-mono text-[11px] space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">STARTING CAPITAL</span>
            <span className="text-cyan-400 font-bold">{formatCurrency(STARTING_CASH)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ROUND</span>
            <span className="text-white font-bold">{round} / {maxRounds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">INSTRUMENTS</span>
            <span className="text-amber-400 font-bold">5 STOCKS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">SESSION</span>
            <span className="text-slate-300">390 TICKS (~1 MIN)</span>
          </div>
        </div>

        {/* Name input */}
        <div className="w-full">
          <label className="block text-[10px] text-slate-500 font-mono tracking-[0.15em] mb-1.5">
            TRADER NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-slate-600 focus:border-[#00ff88]/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-3 bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-mono font-bold text-sm tracking-wider rounded-lg transition-colors"
        >
          START TRADING
        </button>

        {/* Objectives hint */}
        <div className="text-center text-[10px] text-slate-600 font-mono leading-relaxed">
          Trade stocks, complete challenges, and maximize your score.
          <br />
          P&L, risk management, accuracy, and speed all count.
        </div>
      </div>
    </div>
  );
}
