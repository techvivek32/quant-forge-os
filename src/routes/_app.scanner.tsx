import { createFileRoute } from "@tanstack/react-router";
import { QUOTES, fmtCompact, fmtMoney } from "@/lib/market-data";
import { Delta } from "@/components/Delta";
import { Radar, Zap, TrendingUp, Activity, Sparkles, Flame } from "lucide-react";

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "Scanner · NOVA" }, { name: "description", content: "Realtime scanners — breakouts, unusual volume, gaps, momentum, options flow." }] }),
  component: ScannerPage,
});

const SCANNERS = [
  { name: "Breakout 52W High", icon: TrendingUp, color: "text-bull" },
  { name: "Unusual Volume", icon: Activity, color: "text-violet" },
  { name: "Gap & Go", icon: Zap, color: "text-warn" },
  { name: "Momentum Burst", icon: Flame, color: "text-bear" },
  { name: "Options Flow", icon: Sparkles, color: "text-info" },
  { name: "Premarket Risers", icon: Radar, color: "text-bull" },
];

function ScannerPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Scanner Engine</h1>
          <p className="text-sm text-muted-foreground">Realtime market scans with AI ranking and alert-on-match.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 hairline px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-bull pulse-dot" /> 6 scanners running
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCANNERS.map((s) => (
          <div key={s.name} className="rounded-xl glass p-4 hover:bg-surface-2 cursor-pointer transition group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-surface-2 grid place-items-center hairline">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-sm font-semibold">{s.name}</div>
              </div>
              <div className="text-[10px] text-muted-foreground">12 hits</div>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">Refresh every 5s · AI rank ON</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Radar className="h-4 w-4 text-info" /> Live Hits — Breakout 52W High
          </div>
          <span className="text-[11px] text-muted-foreground">Updated 2s ago</span>
        </div>
        <div className="grid grid-cols-12 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground hairline-b">
          <div className="col-span-2">Symbol</div>
          <div className="col-span-3">Trigger</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Change</div>
          <div className="col-span-2 text-right">RVOL</div>
          <div className="col-span-1 text-right">AI Score</div>
        </div>
        {QUOTES.slice(0, 10).map((q) => (
          <div key={q.symbol} className="grid grid-cols-12 items-center px-3 py-2.5 hairline-b last:border-0 hover:bg-surface-2 transition">
            <div className="col-span-2 text-sm font-semibold">{q.symbol}</div>
            <div className="col-span-3 text-xs text-muted-foreground">Broke prior high · vol +218%</div>
            <div className="col-span-2 text-right num text-sm">{fmtMoney(q.price)}</div>
            <div className="col-span-2 text-right"><Delta value={Math.abs(q.changePct)} /></div>
            <div className="col-span-2 text-right num text-xs">{(Math.random() * 4 + 1).toFixed(2)}x</div>
            <div className="col-span-1 text-right">
              <span className="inline-flex items-center justify-center rounded-md gradient-primary text-background text-[10px] font-bold px-1.5 py-0.5">
                {Math.floor(Math.random() * 25) + 70}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
