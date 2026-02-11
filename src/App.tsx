import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { useGameStore, selectPhase, selectStocks } from './game-engine/useGameStore';
import { evaluateChallenges, CHALLENGES } from './game-engine';
import type { Stock } from './utils/types';

// Layout components
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';
import { ResultsScreen } from './components/ui/ResultsScreen';
import { SortableZone } from './components/ui/SortableZone';

// Market / chart components
import { PriceChart } from './components/charts/PriceChart';
import { OrderBook } from './components/charts/OrderBook';
import { PortfolioChart } from './components/charts/PortfolioChart';

// Trading components
import { TradeExecutionPanel } from './components/ui/TradeExecutionPanel';
import { PnLTracker } from './components/ui/PnLTracker';
import { PortfolioView } from './components/ui/PortfolioView';

// Feed components
import { StockTicker } from './components/market/StockTicker';
import { NewsTicker } from './components/ui/NewsTicker';

function ChallengeTracker({ playerId }: { playerId: string }) {
  const players = useGameStore((s) => s.players);
  const stocks = useGameStore(selectStocks);
  const player = players.find((p) => p.id === playerId) ?? players[0];

  const progress = useMemo(() => {
    if (!player) return [];
    return evaluateChallenges(player, stocks);
  }, [player, stocks]);

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono">
      <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-2">CHALLENGES</div>
      <div className="space-y-1.5">
        {CHALLENGES.map((challenge) => {
          const cp = progress.find((p) => p.challengeId === challenge.id);
          const completed = cp?.completed ?? false;
          const pct = (cp?.progress ?? 0) * 100;
          return (
            <div key={challenge.id} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className={completed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {completed ? '\u2714 ' : ''}{challenge.name}
                </span>
                <span className={`font-bold ${completed ? 'text-emerald-400' : 'text-slate-600'}`}>
                  +{challenge.reward}
                </span>
              </div>
              <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    completed ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpeedControl() {
  const tickSpeed = useGameStore((s) => s.tickSpeed);
  const setTickSpeed = useGameStore((s) => s.setTickSpeed);
  const pauseTrading = useGameStore((s) => s.pauseTrading);
  const resumeTrading = useGameStore((s) => s.resumeTrading);
  const isRunning = useGameStore((s) => s._intervalId !== null);

  const speeds = [
    { label: '1x', ms: 200 },
    { label: '2x', ms: 100 },
    { label: '5x', ms: 40 },
  ];

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={isRunning ? pauseTrading : resumeTrading}
        className="px-2 py-1 text-[9px] font-bold font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
      >
        {isRunning ? '\u23F8 PAUSE' : '\u25B6 PLAY'}
      </button>
      {speeds.map((s) => (
        <button
          key={s.label}
          onClick={() => setTickSpeed(s.ms)}
          className={`px-1.5 py-1 text-[9px] font-bold font-mono rounded transition-colors ${
            tickSpeed === s.ms
              ? 'bg-[#00ff88]/20 text-[#00ff88]'
              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

const LEFT_DEFAULT = ['stock-ticker', 'challenges', 'news'];
const CENTER_DEFAULT = ['chart', 'order-book', 'trade-execution'];
const RIGHT_DEFAULT = ['pnl', 'positions', 'allocation'];

function TradingScreen({ playerId, selectedStock, onSelectStock }: {
  playerId: string;
  selectedStock: Stock | null;
  onSelectStock: (stock: Stock) => void;
}) {
  const stocks = useGameStore(selectStocks);
  const players = useGameStore((s) => s.players);
  const player = players.find((p) => p.id === playerId) ?? players[0];

  const panelRegistry: Record<string, ReactNode> = useMemo(() => ({
    'stock-ticker': <StockTicker stocks={stocks} onSelect={onSelectStock} selectedId={selectedStock?.id} />,
    'challenges': <ChallengeTracker playerId={playerId} />,
    'news': <NewsTicker />,
    'chart': <PriceChart stock={selectedStock} />,
    'order-book': <OrderBook stock={selectedStock} maxLevels={8} />,
    'trade-execution': <TradeExecutionPanel stock={selectedStock} playerId={playerId} />,
    'pnl': <PnLTracker playerId={playerId} />,
    'positions': <PortfolioView playerId={playerId} />,
    'allocation': <PortfolioChart player={player ?? null} />,
  }), [stocks, selectedStock, playerId, player, onSelectStock]);

  const renderPanel = useCallback((panelId: string) => panelRegistry[panelId] ?? null, [panelRegistry]);

  const centerPanelClassName = useCallback((panelId: string) => panelId === 'chart' ? 'flex-1 min-h-0' : '', []);

  return (
    <div className="flex flex-col h-screen">
      <HUD />

      {/* Speed controls bar */}
      <div className="bg-[#0a0e17] border-b border-slate-800 px-4 py-1 flex items-center justify-between">
        <SpeedControl />
        {player && (
          <div className="text-[10px] font-mono text-slate-500">
            {player.name}
            <span className="text-slate-700 mx-1">&middot;</span>
            <span className="text-slate-400">{player.tradeHistory.length} trades</span>
          </div>
        )}
      </div>

      {/* Main grid */}
      <main className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden min-h-0">
        <SortableZone
          zoneId="left"
          defaultOrder={LEFT_DEFAULT}
          renderPanel={renderPanel}
          className="col-span-2 flex flex-col gap-2 overflow-y-auto min-h-0"
        />
        <SortableZone
          zoneId="center"
          defaultOrder={CENTER_DEFAULT}
          renderPanel={renderPanel}
          panelClassName={centerPanelClassName}
          className="col-span-7 flex flex-col gap-2 min-h-0"
        />
        <SortableZone
          zoneId="right"
          defaultOrder={RIGHT_DEFAULT}
          renderPanel={renderPanel}
          className="col-span-3 flex flex-col gap-2 overflow-y-auto min-h-0"
        />
      </main>
    </div>
  );
}

function App() {
  const phase = useGameStore(selectPhase);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const stocks = useGameStore(selectStocks);
  const nextRound = useGameStore((s) => s.nextRound);
  const startTrading = useGameStore((s) => s.startTrading);
  const reset = useGameStore((s) => s.reset);

  const selectedStock = selectedStockId
    ? stocks.find((s) => s.id === selectedStockId) ?? null
    : stocks[0] ?? null;

  const handleSelectStock = (stock: Stock) => {
    setSelectedStockId(stock.id);
  };

  const handleStart = (id: string) => {
    setPlayerId(id);
    setSelectedStockId(null);
  };

  const handleNextRound = () => {
    nextRound();
    startTrading();
    setSelectedStockId(null);
  };

  const handleNewGame = () => {
    reset();
    setPlayerId(null);
    setSelectedStockId(null);
  };

  if (phase === 'lobby') {
    return <MainMenu onStart={handleStart} />;
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        playerId={playerId ?? ''}
        onNextRound={handleNextRound}
        onNewGame={handleNewGame}
      />
    );
  }

  return (
    <TradingScreen
      playerId={playerId ?? ''}
      selectedStock={selectedStock}
      onSelectStock={handleSelectStock}
    />
  );
}

export default App;
