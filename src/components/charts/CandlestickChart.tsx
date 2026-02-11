import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { Stock } from '../../utils/types';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  stock: Stock | null;
  height?: number;
  candlePeriod?: number;
}

function deriveCandlesFromHistory(
  prices: number[],
  volumes: number[],
  period: number,
): Candle[] {
  const candles: Candle[] = [];
  for (let i = 0; i < prices.length; i += period) {
    const slice = prices.slice(i, i + period);
    if (!slice.length) continue;
    const volSlice = volumes.slice(i, i + period);
    candles.push({
      open: slice[0],
      high: Math.max(...slice),
      low: Math.min(...slice),
      close: slice[slice.length - 1],
      volume: volSlice.reduce((a, b) => a + b, 0) || 0,
    });
  }
  return candles;
}

export function CandlestickChart({
  stock,
  height = 320,
  candlePeriod = 5,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    candle: Candle;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const candles = useMemo(() => {
    if (!stock) return [];
    const prices = stock.priceHistory.length
      ? stock.priceHistory
      : [stock.price];
    const volumes = stock.volume?.history ?? [];
    return deriveCandlesFromHistory(prices, volumes, candlePeriod);
  }, [stock?.priceHistory, stock?.volume?.history, stock?.price, candlePeriod]);

  const pad = { top: 28, right: 62, bottom: 4, left: 4 };
  const priceRatio = 0.75;
  const volRatio = 0.2;
  const gapRatio = 0.05;
  const innerW = width - pad.left - pad.right;
  const priceH = (height - pad.top - pad.bottom) * priceRatio;
  const volH = (height - pad.top - pad.bottom) * volRatio;
  const gapH = (height - pad.top - pad.bottom) * gapRatio;

  const maxVisible = 60;
  const visible = candles.slice(-maxVisible);

  const { pMin, pMax } = useMemo(() => {
    if (!visible.length) return { pMin: 0, pMax: 100 };
    const lo = Math.min(...visible.map((c) => c.low));
    const hi = Math.max(...visible.map((c) => c.high));
    const margin = (hi - lo) * 0.08 || 1;
    return { pMin: lo - margin, pMax: hi + margin };
  }, [visible]);

  const maxVol = useMemo(
    () => Math.max(1, ...visible.map((c) => c.volume)),
    [visible],
  );

  const yPrice = useCallback(
    (p: number) => priceH - ((p - pMin) / (pMax - pMin)) * priceH,
    [priceH, pMin, pMax],
  );
  const yVol = useCallback(
    (v: number) => volH - (v / maxVol) * volH,
    [volH, maxVol],
  );

  const candleW = Math.max(
    3,
    Math.floor(innerW / Math.max(visible.length, 1)) - 2,
  );
  const gap = Math.max(
    1,
    Math.floor(
      (innerW - candleW * visible.length) /
        Math.max(visible.length - 1, 1),
    ),
  );

  const gridCount = 6;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const p = pMin + ((pMax - pMin) * i) / (gridCount - 1);
    return { price: p, y: yPrice(p) };
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left - pad.left;
      const my = e.clientY - rect.top - pad.top;
      const idx = Math.floor(mx / (candleW + gap));
      if (
        idx >= 0 &&
        idx < visible.length &&
        mx >= 0 &&
        mx <= innerW &&
        my >= 0
      ) {
        setHover({ x: mx, y: my, candle: visible[idx] });
      } else {
        setHover(null);
      }
    },
    [visible, candleW, gap, innerW, pad.left, pad.top],
  );

  if (!stock) {
    return (
      <div
        ref={containerRef}
        style={{ height }}
        className="flex items-center justify-center text-slate-600 font-mono text-xs tracking-[0.2em]"
      >
        SELECT INSTRUMENT
      </div>
    );
  }

  const change = stock.price - stock.previousClose;
  const changePct = stock.previousClose
    ? (change / stock.previousClose) * 100
    : 0;
  const up = change >= 0;

  return (
    <div ref={containerRef} className="w-full relative select-none" style={{ height }}>
      {/* Header overlay */}
      <div className="absolute top-1.5 left-2 z-10 flex items-baseline gap-3 font-mono pointer-events-none">
        <span className="text-[13px] font-bold text-white tracking-wider">
          {stock.ticker}
        </span>
        <span
          className={`text-[13px] font-bold ${up ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}
        >
          {stock.price.toFixed(2)}
        </span>
        <span
          className={`text-[10px] ${up ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}
        >
          {up ? '\u25B2' : '\u25BC'} {Math.abs(change).toFixed(2)} (
          {Math.abs(changePct).toFixed(2)}%)
        </span>
        {stock.halted && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded animate-pulse">
            HALTED
          </span>
        )}
      </div>

      {/* OHLC on hover */}
      {hover && (
        <div
          className="absolute z-20 bg-[#0d1117]/95 border border-slate-700 px-2 py-1 font-mono text-[10px] pointer-events-none rounded"
          style={{
            left: Math.min(pad.left + hover.x + 14, width - 120),
            top: pad.top + Math.min(hover.y, priceH - 60),
          }}
        >
          <div className="text-slate-500">
            O{' '}
            <span className="text-slate-200">
              {hover.candle.open.toFixed(2)}
            </span>
          </div>
          <div className="text-slate-500">
            H{' '}
            <span className="text-[#00ff88]">
              {hover.candle.high.toFixed(2)}
            </span>
          </div>
          <div className="text-slate-500">
            L{' '}
            <span className="text-[#ff3366]">
              {hover.candle.low.toFixed(2)}
            </span>
          </div>
          <div className="text-slate-500">
            C{' '}
            <span className="text-white">
              {hover.candle.close.toFixed(2)}
            </span>
          </div>
          {hover.candle.volume > 0 && (
            <div className="text-slate-500">
              V{' '}
              <span className="text-cyan-400">
                {hover.candle.volume.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      <svg
        width={width}
        height={height}
        className="font-mono"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Price grid */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={g.y}
                x2={innerW}
                y2={g.y}
                stroke="#1a2332"
                strokeWidth={1}
              />
              <text
                x={innerW + 6}
                y={g.y + 3}
                fill="#475569"
                fontSize={9}
              >
                {g.price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Candlesticks */}
          {visible.map((c, i) => {
            const x = i * (candleW + gap);
            const isUp = c.close >= c.open;
            const color = isUp ? '#00ff88' : '#ff3366';
            const bTop = yPrice(Math.max(c.open, c.close));
            const bBot = yPrice(Math.min(c.open, c.close));
            const bH = Math.max(1, bBot - bTop);
            return (
              <g key={i}>
                <line
                  x1={x + candleW / 2}
                  y1={yPrice(c.high)}
                  x2={x + candleW / 2}
                  y2={yPrice(c.low)}
                  stroke={color}
                  strokeWidth={1}
                />
                <rect
                  x={x}
                  y={bTop}
                  width={candleW}
                  height={bH}
                  fill={isUp ? 'transparent' : color}
                  stroke={color}
                  strokeWidth={1}
                />
              </g>
            );
          })}

          {/* Current price line */}
          <line
            x1={0}
            y1={yPrice(stock.price)}
            x2={innerW}
            y2={yPrice(stock.price)}
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
          <rect
            x={innerW + 1}
            y={yPrice(stock.price) - 8}
            width={58}
            height={16}
            fill="#f59e0b"
            rx={2}
          />
          <text
            x={innerW + 4}
            y={yPrice(stock.price) + 4}
            fill="#000"
            fontSize={9}
            fontWeight="bold"
          >
            {stock.price.toFixed(2)}
          </text>

          {/* Crosshair */}
          {hover && (
            <>
              <line
                x1={hover.x}
                y1={0}
                x2={hover.x}
                y2={priceH}
                stroke="#334155"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <line
                x1={0}
                y1={hover.y}
                x2={innerW}
                y2={hover.y}
                stroke="#334155"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            </>
          )}

          {/* Volume bars */}
          <g transform={`translate(0,${priceH + gapH})`}>
            {visible.map((c, i) => {
              if (c.volume <= 0) return null;
              const x = i * (candleW + gap);
              const isUp = c.close >= c.open;
              const color = isUp ? '#00ff8833' : '#ff336633';
              const barH = volH - yVol(c.volume);
              return (
                <rect
                  key={i}
                  x={x}
                  y={volH - barH}
                  width={candleW}
                  height={barH}
                  fill={color}
                />
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
