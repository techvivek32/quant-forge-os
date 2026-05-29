import { createFileRoute } from "@tanstack/react-router";
import { Delta } from "@/components/Delta";
import { QUOTES, fmtMoney } from "@/lib/market-data";
import { X } from "lucide-react";

export const Route = createFileRoute("/_app/positions")({
  head: () => ({ meta: [{ title: "Positions · NOVA" }, { name: "description", content: "Open positions with realtime P&L, exposure and risk." }] }),
  component: Positions,
});

function Positions() {
  const rows = QUOTES.slice(0, 9).map((q) => {
    const qty = Math.floor(Math.random() * 200) + 25;
    const entry = +(q.price * (1 - (Math.random() - 0.4) * 0.05)).toFixed(2);
    const pnl = +((q.price - entry) * qty).toFixed(2);
    const pnlPct = +(((q.price - entry) / entry) * 100).toFixed(2);
    return { q, qty, entry, pnl, pnlPct };
  });
  const total = rows.reduce((a, r) => a + r.pnl, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Open Positions</h1>
          <p className="text-sm text-muted-foreground">Realtime mark-to-market P&L synced from IBKR.</p>
        </div>
        <div className="rounded-xl glass px-4 py-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Unrealized</div>
          <div className={`text-lg font-semibold num ${total >= 0 ? "text-bull" : "text-bear"}`}>
            {total >= 0 ? "+" : ""}${fmtMoney(total)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground hairline-b">
          <div className="col-span-2">Symbol</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-2 text-right">Entry</div>
          <div className="col-span-2 text-right">Mark</div>
          <div className="col-span-2 text-right">Unrealized P&L</div>
          <div className="col-span-1 text-right">%</div>
          <div className="col-span-1 text-right">Risk</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        {rows.map((r) => {
          const up = r.pnl >= 0;
          const risk = ["Low", "Med", "High"][Math.floor(Math.random() * 3)];
          const riskColor = risk === "Low" ? "text-bull" : risk === "Med" ? "text-warn" : "text-bear";
          return (
            <div key={r.q.symbol} className="grid grid-cols-12 items-center px-4 py-3 hairline-b last:border-0 hover:bg-surface-2 transition">
              <div className="col-span-2">
                <div className="text-sm font-semibold">{r.q.symbol}</div>
                <div className="text-[11px] text-muted-foreground truncate">{r.q.name}</div>
              </div>
              <div className="col-span-1 text-right num text-sm">{r.qty}</div>
              <div className="col-span-2 text-right num text-sm text-muted-foreground">${fmtMoney(r.entry)}</div>
              <div className="col-span-2 text-right num text-sm">${fmtMoney(r.q.price)}</div>
              <div className={`col-span-2 text-right num text-sm font-semibold ${up ? "text-bull" : "text-bear"}`}>
                {up ? "+" : ""}${fmtMoney(r.pnl)}
              </div>
              <div className="col-span-1 text-right"><Delta value={r.pnlPct} /></div>
              <div className={`col-span-1 text-right text-xs font-medium ${riskColor}`}>{risk}</div>
              <div className="col-span-1 flex justify-end">
                <button className="h-7 w-7 rounded-md hairline bg-surface-2 hover:bg-bear/20 grid place-items-center transition">
                  <X className="h-3.5 w-3.5 text-bear" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
