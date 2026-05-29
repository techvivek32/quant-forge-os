import { createFileRoute } from "@tanstack/react-router";
import { Sparkline } from "@/components/Sparkline";
import { Delta } from "@/components/Delta";
import { QUOTES, fmtCompact, fmtMoney } from "@/lib/market-data";
import { GripVertical, Plus, Star } from "lucide-react";

export const Route = createFileRoute("/_app/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist · NOVA" }, { name: "description", content: "Custom realtime watchlists with sparklines and quick trade." }] }),
  component: WatchlistPage,
});

const LISTS = ["Mega Caps", "AI / Semis", "Earnings This Week", "My Swing"];

function WatchlistPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Watchlists</h1>
          <p className="text-sm text-muted-foreground">Realtime quotes with sparklines, alerts, and quick trade.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg gradient-primary text-background px-3 h-9 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" /> New Watchlist
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {LISTS.map((l, i) => (
          <button
            key={l}
            className={`px-3 h-8 rounded-lg text-xs hairline ${i === 0 ? "bg-primary/15 text-foreground" : "bg-surface-1 text-muted-foreground hover:bg-surface-2"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground hairline-b">
          <div className="col-span-1"></div>
          <div className="col-span-3">Symbol</div>
          <div className="col-span-2 text-right">Last</div>
          <div className="col-span-2 text-right">Change</div>
          <div className="col-span-2 text-right">Volume</div>
          <div className="col-span-2 text-right">Trend</div>
        </div>
        <div>
          {QUOTES.slice(0, 14).map((q) => {
            const up = q.changePct >= 0;
            return (
              <div key={q.symbol} className="grid grid-cols-12 items-center px-4 py-3 hairline-b last:border-b-0 hover:bg-surface-2 transition group">
                <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition" />
                  <Star className="h-3.5 w-3.5 text-warn" fill="currentColor" />
                </div>
                <div className="col-span-3">
                  <div className="text-sm font-semibold">{q.symbol}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{q.name}</div>
                </div>
                <div className="col-span-2 text-right num text-sm">{fmtMoney(q.price)}</div>
                <div className="col-span-2 text-right"><Delta value={q.changePct} /></div>
                <div className="col-span-2 text-right num text-xs text-muted-foreground">{fmtCompact(q.volume)}</div>
                <div className="col-span-2 flex justify-end"><Sparkline data={q.spark} positive={up} width={92} height={28} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
