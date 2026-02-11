import { useState } from 'react';
import type { Stock } from '../../utils/types';
import { useGameStore } from '../../game-engine/useGameStore';
import { formatCurrency } from '../../utils/helpers';

type TradeAction = 'buy' | 'sell' | 'short' | 'cover';

interface TradeExecutionPanelProps {
  stock: Stock | null;
  playerId?: string;
}

const ACTIONS: {
  key: TradeAction;
  label: string;
  idle: string;
  active: string;
}[] = [
  {
    key: 'buy',
    label: 'BUY',
    idle: 'text-emerald-600 bg-slate-900 hover:bg-emerald-950',
    active: 'bg-emerald-500 text-black',
  },
  {
    key: 'sell',
    label: 'SELL',
    idle: 'text-rose-600 bg-slate-900 hover:bg-rose-950',
    active: 'bg-rose-500 text-black',
  },
  {
    key: 'short',
    label: 'SHORT',
    idle: 'text-orange-600 bg-slate-900 hover:bg-orange-950',
    active: 'bg-orange-500 text-black',
  },
  {
    key: 'cover',
    label: 'COVER',
    idle: 'text-cyan-600 bg-slate-900 hover:bg-cyan-950',
    active: 'bg-cyan-500 text-black',
  },
];

const PRESETS = [10, 25, 50, 100, 250, 500] as const;

export function TradeExecutionPanel({
  stock,
  playerId,
}: TradeExecutionPanelProps) {
  const [action, setAction] = useState<TradeAction>('buy');
  const [quantity, setQuantity] = useState(100);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const players = useGameStore((s) => s.players);
  const executeTrade = useGameStore((s) => s.executeTrade);
  const player = players.find((p) => p.id === playerId) ?? players[0];

  const currentAction = ACTIONS.find((a) => a.key === action)!;
  const usesAskSide = action === 'buy' || action === 'cover';
  const fillPrice = stock
    ? usesAskSide
      ? stock.orderBook.asks[0]?.price ?? stock.price
      : stock.orderBook.bids[0]?.price ?? stock.price
    : 0;
  const estimatedTotal = fillPrice * quantity;
  const currentPosition =
    player && stock ? (player.portfolio[stock.id] ?? 0) : 0;

  const handleExecute = () => {
    if (!stock || !player) return;
    const result = executeTrade(
      player.id,
      stock.id,
      action,
      quantity,
    );
    if (result) {
      setLastResult(
        `${currentAction.label} ${quantity} ${stock.ticker} @ ${result.price.toFixed(2)}`,
      );
      setTimeout(() => setLastResult(null), 3000);
    } else {
      setLastResult('ORDER REJECTED');
      setTimeout(() => setLastResult(null), 2000);
    }
  };

  const canExecute = (() => {
    if (!stock || !player || stock.halted) return false;
    switch (action) {
      case 'buy':
        return player.cash >= estimatedTotal;
      case 'sell':
        return currentPosition > 0 && currentPosition >= quantity;
      case 'short':
        return player.cash >= estimatedTotal;
      case 'cover':
        return currentPosition < 0 && Math.abs(currentPosition) >= quantity;
    }
  })();

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-slate-500 tracking-[0.15em]">
          TRADE EXECUTION
        </div>
        {stock && (
          <div className="text-[10px] text-slate-500">
            POS{' '}
            <span
              className={
                currentPosition > 0
                  ? 'text-emerald-400'
                  : currentPosition < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
              }
            >
              {currentPosition}
            </span>
          </div>
        )}
      </div>

      {!stock ? (
        <div className="text-center text-slate-600 py-6 text-[11px] tracking-[0.15em]">
          SELECT INSTRUMENT TO TRADE
        </div>
      ) : (
        <>
          {/* Action selector */}
          <div className="grid grid-cols-4 gap-1 mb-3">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAction(a.key)}
                className={`py-1.5 text-[10px] font-bold rounded transition-colors ${
                  action === a.key ? a.active : a.idle
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Quantity presets */}
          <div className="mb-2">
            <div className="text-[9px] text-slate-600 mb-1">SHARES</div>
            <div className="grid grid-cols-6 gap-1 mb-1">
              {PRESETS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`py-1 text-[9px] rounded transition-colors ${
                    quantity === q
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-[12px] text-white focus:border-slate-500 focus:outline-none"
            />
          </div>

          {/* Order preview */}
          <div className="bg-slate-900/50 rounded p-2 mb-3 text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">INSTRUMENT</span>
              <span className="text-white font-bold">{stock.ticker}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FILL PRICE</span>
              <span className="text-amber-400">{fillPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">QTY</span>
              <span className="text-white">{quantity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1">
              <span className="text-slate-500">EST. TOTAL</span>
              <span className="text-white font-bold">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
            {player && (
              <div className="flex justify-between">
                <span className="text-slate-500">BUYING POWER</span>
                <span
                  className={
                    player.cash >= estimatedTotal
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  {formatCurrency(player.cash)}
                </span>
              </div>
            )}
          </div>

          {/* Execute button */}
          <button
            onClick={handleExecute}
            disabled={!canExecute}
            className={`w-full py-2 rounded font-bold text-[12px] tracking-wider transition-colors ${
              action === 'buy' || action === 'cover'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black disabled:bg-emerald-500/20 disabled:text-emerald-500/40'
                : 'bg-rose-500 hover:bg-rose-400 text-black disabled:bg-rose-500/20 disabled:text-rose-500/40'
            }`}
          >
            {stock.halted
              ? 'TRADING HALTED'
              : `${currentAction.label} ${quantity.toLocaleString()} ${stock.ticker}`}
          </button>

          {/* Last trade feedback */}
          {lastResult && (
            <div
              className={`mt-2 text-center text-[10px] py-1 rounded ${
                lastResult === 'ORDER REJECTED'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {lastResult}
            </div>
          )}
        </>
      )}
    </div>
  );
}
