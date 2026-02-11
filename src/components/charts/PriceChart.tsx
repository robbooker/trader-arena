import type { Stock } from '../../utils/types';

interface PriceChartProps {
  stock: Stock | null;
}

export function PriceChart({ stock }: PriceChartProps) {
  if (!stock) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800 rounded-lg border border-slate-700">
        <span className="text-slate-500">Select a stock to view chart</span>
      </div>
    );
  }

  return (
    <div className="h-64 bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h3 className="text-sm font-semibold mb-2">
        {stock.ticker} — ${stock.price.toFixed(2)}
      </h3>
      {/* Recharts integration goes here */}
      <div className="flex items-center justify-center h-48 text-slate-500">
        Chart placeholder for {stock.ticker}
      </div>
    </div>
  );
}
