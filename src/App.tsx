import { useGameStore } from './game-engine/useGameStore';
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';
import { PriceChart } from './components/charts/PriceChart';
import { PortfolioChart } from './components/charts/PortfolioChart';
import { StockTicker } from './components/market/StockTicker';
import { EventFeed } from './components/market/EventFeed';
import { TradePanel } from './components/market/TradePanel';

function App() {
  const { phase, stocks, events, players } = useGameStore();

  if (phase === 'lobby') {
    return <MainMenu />;
  }

  return (
    <div className="flex flex-col h-screen">
      <HUD />
      <main className="flex-1 grid grid-cols-4 gap-4 p-4 overflow-hidden">
        <aside className="col-span-1 overflow-y-auto flex flex-col gap-4">
          <StockTicker stocks={stocks} onSelect={() => {}} />
          <EventFeed events={events} />
        </aside>
        <section className="col-span-2 flex flex-col gap-4">
          <PriceChart stock={null} />
          <TradePanel stock={null} />
        </section>
        <aside className="col-span-1">
          <PortfolioChart player={players[0] ?? null} />
        </aside>
      </main>
    </div>
  );
}

export default App;
