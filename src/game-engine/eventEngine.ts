import type { Stock, MarketEvent, MarketEventType } from '../utils/types';
import { generateId } from '../utils/helpers';

// --- Event templates ---

interface EventTemplate {
  type: MarketEventType;
  titles: string[];
  descriptions: string[];
  priceImpactRange: [number, number]; // [min, max] as multipliers
  volumeImpactRange: [number, number];
  durationRange: [number, number]; // ticks
  halts: boolean; // does this halt trading?
  haltDuration: [number, number]; // ticks halted
  weight: number; // relative probability weight
  sectorBias?: string[]; // more likely in these sectors
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'earnings_surprise',
    titles: [
      '{ticker} Crushes Earnings Estimates',
      '{ticker} Reports Blowout Quarter',
      '{ticker} Revenue Beats by 40%',
    ],
    descriptions: [
      '{name} reported EPS of $0.12 vs. consensus of -$0.05. Revenue up 120% YoY.',
      '{name} surprised Wall Street with its first profitable quarter. Short sellers scrambling.',
      'Massive beat on top and bottom line. Guidance raised for full year.',
    ],
    priceImpactRange: [1.15, 1.60],
    volumeImpactRange: [4, 12],
    durationRange: [20, 60],
    halts: false,
    haltDuration: [0, 0],
    weight: 10,
  },
  {
    type: 'earnings_miss',
    titles: [
      '{ticker} Misses Earnings Badly',
      '{ticker} Reports Wider-Than-Expected Loss',
      '{ticker} Revenue Falls Short',
    ],
    descriptions: [
      '{name} posted a loss of -$0.22 vs. expected -$0.08. Cash burn accelerating.',
      'Disappointing results across the board. Management lowered guidance.',
      '{name} missed revenue estimates by 30%. Customer churn increasing.',
    ],
    priceImpactRange: [0.55, 0.85],
    volumeImpactRange: [3, 8],
    durationRange: [15, 45],
    halts: false,
    haltDuration: [0, 0],
    weight: 10,
  },
  {
    type: 'sec_halt',
    titles: [
      'TRADING HALTED: {ticker} Pending News',
      '{ticker} Halted — Volatility Circuit Breaker',
      'LULD Halt on {ticker}',
    ],
    descriptions: [
      'Trading in {name} has been halted pending a company announcement.',
      'Circuit breaker triggered on {ticker} after rapid price movement.',
      'Limit Up/Limit Down halt on {ticker}. Trading to resume shortly.',
    ],
    priceImpactRange: [0.70, 1.40], // could go either way on resume
    volumeImpactRange: [8, 20],
    durationRange: [30, 90],
    halts: true,
    haltDuration: [10, 30],
    weight: 5,
  },
  {
    type: 'dilution',
    titles: [
      '{ticker} Announces Shelf Offering',
      '{ticker} Files ATM Offering — Dilution Alert',
      '{ticker} Prices Secondary Offering',
    ],
    descriptions: [
      '{name} filed to sell up to $15M in shares at market prices. Dilution risk.',
      'Direct offering priced at 15% discount to market. Shares outstanding increase 20%.',
      '{name} registered 8M new shares for sale. Float expanding significantly.',
    ],
    priceImpactRange: [0.60, 0.82],
    volumeImpactRange: [5, 15],
    durationRange: [30, 80],
    halts: false,
    haltDuration: [0, 0],
    weight: 8,
  },
  {
    type: 'short_squeeze',
    titles: [
      '{ticker} Short Squeeze Developing',
      'Shorts Trapped in {ticker} — Squeeze Alert',
      '{ticker} Borrow Rate Spikes to 300%',
    ],
    descriptions: [
      'Short interest at {si}% of float. Borrow fees skyrocketing. Forced covering imminent.',
      'No shares available to borrow on {ticker}. Short sellers getting margin called.',
      'Massive buy volume on {ticker} as shorts scramble to cover. Float locked up.',
    ],
    priceImpactRange: [1.25, 2.20],
    volumeImpactRange: [10, 25],
    durationRange: [15, 50],
    halts: false,
    haltDuration: [0, 0],
    weight: 6,
    sectorBias: ['Healthcare', 'Technology'],
  },
  {
    type: 'insider_buying',
    titles: [
      '{ticker} CEO Buys $500K in Open Market',
      'Insider Cluster Buying in {ticker}',
    ],
    descriptions: [
      '{name} CEO purchased 150,000 shares at market price. First insider buy in 2 years.',
      'Three insiders at {name} bought shares this week. Total insider purchases: $1.2M.',
    ],
    priceImpactRange: [1.08, 1.25],
    volumeImpactRange: [2, 5],
    durationRange: [30, 60],
    halts: false,
    haltDuration: [0, 0],
    weight: 5,
  },
  {
    type: 'fda_approval',
    titles: [
      '{ticker} Receives FDA Fast Track Designation',
      'FDA Approves {ticker} Lead Candidate',
    ],
    descriptions: [
      '{name} granted Fast Track for its lead compound. Phase 3 trial expected next quarter.',
      'FDA approval for {name}\'s flagship drug. Addressable market estimated at $2B.',
    ],
    priceImpactRange: [1.30, 2.50],
    volumeImpactRange: [10, 30],
    durationRange: [20, 60],
    halts: false,
    haltDuration: [0, 0],
    weight: 4,
    sectorBias: ['Healthcare'],
  },
  {
    type: 'contract_win',
    titles: [
      '{ticker} Awarded $50M Government Contract',
      '{ticker} Lands Major Partnership Deal',
    ],
    descriptions: [
      '{name} won a multi-year government contract worth $50M. Revenue visibility greatly improved.',
      'Strategic partnership announced between {name} and a Fortune 500 company.',
    ],
    priceImpactRange: [1.12, 1.45],
    volumeImpactRange: [3, 8],
    durationRange: [20, 50],
    halts: false,
    haltDuration: [0, 0],
    weight: 6,
    sectorBias: ['Technology', 'Energy'],
  },
  {
    type: 'offering_announced',
    titles: [
      '{ticker} Announces Warrant Exercise',
      '{ticker} Converts Preferred Shares',
    ],
    descriptions: [
      'Warrants exercised at $0.50 on {ticker}. 5M new shares entering the float.',
      '{name} converting preferred shares to common. Float expected to increase 25%.',
    ],
    priceImpactRange: [0.70, 0.88],
    volumeImpactRange: [4, 10],
    durationRange: [20, 50],
    halts: false,
    haltDuration: [0, 0],
    weight: 6,
  },
  {
    type: 'reddit_momentum',
    titles: [
      '{ticker} Trending on Social Media',
      '{ticker} Going Viral — Retail Pile-In',
    ],
    descriptions: [
      '{ticker} mentions up 500% on social media. Retail traders piling in.',
      '{name} trending #1 on stock forums. "Diamond hands" sentiment dominant.',
    ],
    priceImpactRange: [1.10, 1.80],
    volumeImpactRange: [8, 20],
    durationRange: [10, 40],
    halts: false,
    haltDuration: [0, 0],
    weight: 7,
  },
];

// --- Event generation ---

// Probability of any event per tick (tuned so events happen every ~40-80 ticks)
const BASE_EVENT_PROBABILITY = 0.018;
// Cooldown: minimum ticks between events on the same stock
const PER_STOCK_COOLDOWN = 25;

export function maybeGenerateEvent(
  stocks: Stock[],
  tick: number,
  lastEventTicks: Map<string, number>,
): MarketEvent | null {
  if (Math.random() > BASE_EVENT_PROBABILITY) return null;

  // Pick a random template weighted by probability
  const template = pickWeightedTemplate();

  // Pick a target stock (prefer sector bias if present)
  const eligibleStocks = stocks.filter((s) => {
    if (s.halted) return false;
    const lastEvent = lastEventTicks.get(s.id);
    if (lastEvent !== undefined && tick - lastEvent < PER_STOCK_COOLDOWN) return false;
    if (template.sectorBias && template.sectorBias.length > 0) {
      // 70% chance to respect sector bias
      if (Math.random() < 0.7 && !template.sectorBias.includes(s.sector)) return false;
    }
    return true;
  });

  if (eligibleStocks.length === 0) return null;

  const stock = eligibleStocks[Math.floor(Math.random() * eligibleStocks.length)];

  // Compute impact values
  const [minImpact, maxImpact] = template.priceImpactRange;
  const priceImpact = minImpact + Math.random() * (maxImpact - minImpact);

  const [minVol, maxVol] = template.volumeImpactRange;
  const volumeImpact = minVol + Math.random() * (maxVol - minVol);

  const [minDur, maxDur] = template.durationRange;
  const duration = Math.floor(minDur + Math.random() * (maxDur - minDur));

  // Format text
  const si = ((stock.float.shortInterest / stock.float.floatShares) * 100).toFixed(0);
  const title = pickRandom(template.titles)
    .replace('{ticker}', stock.ticker)
    .replace('{name}', stock.name)
    .replace('{si}', si);
  const description = pickRandom(template.descriptions)
    .replace('{ticker}', stock.ticker)
    .replace('{name}', stock.name)
    .replace('{si}', si);

  return {
    id: generateId(),
    type: template.type,
    title,
    description,
    affectedStockIds: [stock.id],
    priceImpact,
    volumeImpact,
    duration,
    timestamp: Date.now(),
    tick,
  };
}

export function getEventHaltDuration(event: MarketEvent): number {
  const template = EVENT_TEMPLATES.find((t) => t.type === event.type);
  if (!template || !template.halts) return 0;
  const [min, max] = template.haltDuration;
  return Math.floor(min + Math.random() * (max - min));
}

export function isHaltEvent(type: MarketEventType): boolean {
  const template = EVENT_TEMPLATES.find((t) => t.type === type);
  return template?.halts ?? false;
}

// --- Helpers ---

function pickWeightedTemplate(): EventTemplate {
  const totalWeight = EVENT_TEMPLATES.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const template of EVENT_TEMPLATES) {
    roll -= template.weight;
    if (roll <= 0) return template;
  }
  return EVENT_TEMPLATES[0];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
