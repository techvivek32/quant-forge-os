import { createFileRoute } from "@tanstack/react-router";
import { QUOTES, fmtMoney } from "@/lib/market-data";
import { Check, Clock, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/orders")({
  head: () => ({ meta: [{ title: "Orders · NOVA" }, { name: "description", content: "Working, filled, canceled and rejected orders." }] }),
  component: Orders,
});

const TABS = ["Working", "Filled", "Canceled", "Rejected"] as const;

function Orders() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Working");

  const orders = QUOTES.slice(0, 12).map((q, i) => ({
    q,
    side: i % 3 === 0 ? "SELL" : "BUY",
    type: ["LMT", "MKT", "STP", "BRK"][i % 4],
    qty: (Math.floor(Math.random() * 200) + 10),
    price: +(q.price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2),
    status: tab,
    time: `${(9 + Math.floor(Math.random() * 7)).toString().padStart(2, "0")}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}`,
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">Live order book synced with IBKR Gateway.</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 h-8 rounded-lg text-xs hairline ${tab === t ? "bg-primary/15 text-foreground" : "bg-surface-1 text-muted-foreground hover:bg-surface-2"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground hairline-b">
          <div className="col-span-1">Time</div>
          <div className="col-span-2">Symbol</div>
          <div className="col-span-1">Side</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        {orders.map((o, i) => (
          <div key={i} className="grid grid-cols-12 items-center px-4 py-3 hairline-b last:border-0 hover:bg-surface-2 transition">
            <div className="col-span-1 text-xs text-muted-foreground num">{o.time}</div>
            <div className="col-span-2 text-sm font-semibold">{o.q.symbol}</div>
            <div className="col-span-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${o.side === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
                {o.side}
              </span>
            </div>
            <div className="col-span-1 text-xs text-muted-foreground">{o.type}</div>
            <div className="col-span-1 text-right num text-sm">{o.qty}</div>
            <div className="col-span-2 text-right num text-sm">${fmtMoney(o.price)}</div>
            <div className="col-span-2 text-right num text-sm text-muted-foreground">${fmtMoney(o.price * o.qty)}</div>
            <div className="col-span-1">
              <span className="inline-flex items-center gap-1 text-[11px]">
                {tab === "Working" && <><Clock className="h-3 w-3 text-warn" /> <span className="text-warn">Working</span></>}
                {tab === "Filled" && <><Check className="h-3 w-3 text-bull" /> <span className="text-bull">Filled</span></>}
                {tab === "Canceled" && <><X className="h-3 w-3 text-muted-foreground" /> <span className="text-muted-foreground">Canceled</span></>}
                {tab === "Rejected" && <><X className="h-3 w-3 text-bear" /> <span className="text-bear">Rejected</span></>}
              </span>
            </div>
            <div className="col-span-1 flex justify-end">
              {tab === "Working" && (
                <button className="text-[11px] text-bear hover:underline">Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
