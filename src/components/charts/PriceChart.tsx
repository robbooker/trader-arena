import type { Stock } from '../../utils/types';
import { CandlestickChart } from './CandlestickChart';

interface PriceChartProps {
  stock: Stock | null;
}

export function PriceChart({ stock }: PriceChartProps) {
  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded overflow-hidden">
      <CandlestickChart stock={stock} height={320} />
    </div>
  );
}
