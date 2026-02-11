import type { Player } from '../../utils/types';

interface PortfolioChartProps {
  player: Player | null;
}

export function PortfolioChart({ player }: PortfolioChartProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-800 rounded-lg border border-slate-700">
        <span className="text-slate-500">No portfolio data</span>
      </div>
    );
  }

  return (
    <div className="h-48 bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h3 className="text-sm font-semibold mb-2">Portfolio Breakdown</h3>
      {/* Recharts pie/bar chart goes here */}
      <div className="flex items-center justify-center h-32 text-slate-500">
        Portfolio chart placeholder
      </div>
    </div>
  );
}
