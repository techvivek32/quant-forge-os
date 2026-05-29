import { createFileRoute } from "@tanstack/react-router";
import { LiveDot } from "@/components/Delta";
import { Check, Plug, RefreshCw, Shield, Zap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/broker")({
  head: () => ({ meta: [{ title: "Broker · IBKR · NOVA" }, { name: "description", content: "Interactive Brokers connection, gateway health, and trade ticket." }] }),
  component: Broker,
});

function Broker() {
  const [paper, setPaper] = useState(false);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState("LMT");
  const [qty, setQty] = useState(100);
  const [price, setPrice] = useState(232.14);
  const [stop, setStop] = useState(225);
  const [tp, setTp] = useState(248);

  const est = qty * price;
  const fees = (est * 0.00035).toFixed(2);

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-4">
      {/* Connection panel */}
      <div className="space-y-4">
        <div className="rounded-2xl glass p-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-bull/15 blur-3xl" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-primary grid place-items-center glow-primary">
              <Plug className="h-5 w-5 text-background" />
            </div>
            <div>
              <div className="text-sm font-semibold">Interactive Brokers</div>
              <div className="text-[11px] text-muted-foreground">U987342 · {paper ? "Paper" : "Live"} · TWS 10.30.1g</div>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full bg-bull/15 text-bull px-2.5 py-1 text-[11px] font-medium">
              <LiveDot /> Connected
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Health label="API" status="OK" />
            <Health label="Gateway" status="OK" />
            <Health label="Market Data" status="OK" />
            <Health label="Order Router" status="OK" />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl hairline bg-surface-1 p-3">
            <div>
              <div className="text-sm font-medium">{paper ? "Paper Trading" : "Live Trading"}</div>
              <div className="text-[11px] text-muted-foreground">{paper ? "Risk-free simulation account" : "Real money — orders execute on IBKR"}</div>
            </div>
            <button
              onClick={() => setPaper((p) => !p)}
              className={`relative h-6 w-11 rounded-full transition ${paper ? "bg-warn" : "bg-bull glow-bull"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${paper ? "left-0.5" : "left-5.5"}`} style={{ left: paper ? 2 : 22 }} />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="flex-1 h-9 rounded-lg hairline bg-surface-1 hover:bg-surface-2 text-xs font-medium inline-flex items-center justify-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Reconnect
            </button>
            <button className="flex-1 h-9 rounded-lg hairline bg-surface-1 hover:bg-surface-2 text-xs font-medium inline-flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Sync Account
            </button>
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-semibold mb-3">Account Snapshot</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ["Net Liquidation", "$124,582.34"],
              ["Buying Power", "$48,210.55"],
              ["Available Funds", "$31,422.10"],
              ["Initial Margin", "$76,371.79"],
              ["Maintenance Margin", "$52,118.41"],
              ["Excess Liquidity", "$72,463.93"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg hairline bg-surface-1 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="text-sm font-semibold num mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order ticket */}
      <div className="rounded-2xl glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-info" /> Order Ticket</div>
            <div className="text-[11px] text-muted-foreground">{paper ? "Paper" : "Live"} · Smart Routing</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setSide("BUY")}
            className={`h-10 rounded-lg text-sm font-bold transition ${side === "BUY" ? "bg-bull text-background glow-bull" : "hairline bg-surface-1 text-muted-foreground"}`}>
            BUY
          </button>
          <button onClick={() => setSide("SELL")}
            className={`h-10 rounded-lg text-sm font-bold transition ${side === "SELL" ? "bg-bear text-background glow-bear" : "hairline bg-surface-1 text-muted-foreground"}`}>
            SELL
          </button>
        </div>

        <div className="space-y-3">
          <Row label="Symbol">
            <input defaultValue="AAPL" className="w-full h-9 rounded-lg bg-surface-1 hairline px-3 text-sm font-semibold focus:outline-none" />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Quantity">
              <input type="number" value={qty} onChange={(e) => setQty(+e.target.value)} className="w-full h-9 rounded-lg bg-surface-1 hairline px-3 text-sm num focus:outline-none" />
            </Row>
            <Row label="Order Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-9 rounded-lg bg-surface-1 hairline px-3 text-sm focus:outline-none">
                <option>MKT</option><option>LMT</option><option>STP</option><option>STP LMT</option><option>BRACKET</option>
              </select>
            </Row>
          </div>
          <Row label="Limit Price">
            <input type="number" value={price} onChange={(e) => setPrice(+e.target.value)} className="w-full h-9 rounded-lg bg-surface-1 hairline px-3 text-sm num focus:outline-none" />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Stop Loss">
              <input type="number" value={stop} onChange={(e) => setStop(+e.target.value)} className="w-full h-9 rounded-lg bg-surface-1 hairline px-3 text-sm num text-bear focus:outline-none" />
            </Row>
            <Row label="Take Profit">
              <input type="number" value={tp} onChange={(e) => setTp(+e.target.value)} className="w-full h-9 rounded-lg bg-surface-1 hairline px-3 text-sm num text-bull focus:outline-none" />
            </Row>
          </div>
        </div>

        <div className="mt-5 rounded-xl hairline bg-surface-1 p-4 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Estimated cost</span><span className="num font-semibold">${est.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Commission est.</span><span className="num">${fees}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Reward / Risk</span><span className="num text-bull">{((tp - price) / (price - stop)).toFixed(2)}R</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Buying power used</span><span className="num">{((est / 48210) * 100).toFixed(1)}%</span></div>
        </div>

        <button className={`mt-4 w-full h-11 rounded-lg text-sm font-bold tracking-wide ${side === "BUY" ? "bg-bull glow-bull" : "bg-bear glow-bear"} text-background`}>
          PREVIEW & {side} {qty} {`AAPL`} @ ${price}
        </button>
      </div>
    </div>
  );
}

function Health({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg hairline bg-surface-1 p-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1 text-[11px] text-bull font-medium">
        <Check className="h-3 w-3" /> {status}
      </span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
