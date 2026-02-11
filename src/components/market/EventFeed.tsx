import type { MarketEvent } from '../../utils/types';

interface EventFeedProps {
  events: MarketEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  if (events.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-500">
        No market events yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="p-3 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-indigo-400">
              {event.type}
            </span>
            <span className="font-semibold">{event.title}</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{event.description}</p>
        </div>
      ))}
    </div>
  );
}
