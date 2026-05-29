import { createFileRoute } from "@tanstack/react-router";
import { Sparkline } from "@/components/Sparkline";
import { Delta, LiveDot } from "@/components/Delta";
import { INDICES, QUOTES, SECTORS, fmtCompact, fmtMoney, topMovers } from "@/lib/market-data";
import {
  Activity,
  Brain,
  Flame,
  Gauge,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard · NOVA Terminal" },
      { name: "description", content: "Realtime US equities terminal — markets, AI signals, and portfolio at a glance." },
    ],
  }),
  component: Dashboard,
});

const equityCurve = Array.from({ length: 60 }, (_, i) => ({
  t: i,
  v: 100000 + Math.sin(i / 4) * 4200 + i * 320 + (Math.random() - 0.5) * 800,
}));

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  delta?: number;
  icon: any;
  accent?: "primary" | "bull" | "bear" | "violet";
}) {
  const accentMap: Record<string, string> = {
    primary: "from-[oklch(0.74_0.18_235/0.18)] to-transparent",
    bull: "from-[oklch(0.78_0.18_152/0.18)] to-transparent",
    bear: "from-[oklch(0.66_0.22_22/0.18)] to-transparent",
    violet: "from-[oklch(0.70_0.18_295/0.18)] to-transparent",
  };
  const iconColor: Record<string, string> = {
    primary: "text-info", bull: "text-bull", bear: "text-bear", violet: "text-violet",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5 animate-fade-up">
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-2xl`} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold num">{value}</div>
        </div>
        <div className="h-9 w-9 rounded-lg bg-surface-2 grid place-items-center hairline">
          <Icon className={`h-4 w-4 ${iconColor[accent]}`} />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <Delta value={delta} />
          <span className="text-xs text-muted-foreground">vs. yesterday</span>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const gainers = topMovers("gainers");
  const losers = topMovers("losers");
  const movers = topMovers("volume");
  const fgIndex = 72;

  return (
    <div className="p-6 space-y-6">
      {/* Hero KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={`$${fmtMoney(124_582.34)}`} delta={1.24} icon={Activity} accent="primary" />
        <StatCard label="Day P&L" value="+$1,842.10" delta={1.51} icon={TrendingUp} accent="bull" />
        <StatCard label="Open Positions" value="14" delta={-0.32} icon={Gauge} accent="violet" />
        <StatCard label="Buying Power" value={`$${fmtMoney(48_210.55)}`} icon={Zap} accent="primary" />
      </div>

      {/* Equity curve + sentiment */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl glass p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Portfolio Equity</div>
              <div className="text-xs text-muted-foreground">Last 60 sessions · Live</div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((p, i) => (
                <button
                  key={p}
                  className={`px-2.5 h-7 rounded-md hairline ${i === 2 ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={equityCurve} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={["dataMin - 800", "dataMax + 800"]} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.20 0.015 260)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "oklch(0.66 0.018 255)" }}
                  formatter={(v: any) => [`$${fmtMoney(v as number)}`, "Equity"]}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.74 0.18 235)"
                  strokeWidth={2}
                  fill="url(#eq)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fear & Greed + AI sentiment */}
        <div className="space-y-4">
          <div className="rounded-2xl glass p-5 relative overflow-hidden animate-fade-up">
            <div className="absolute inset-0 gradient-hero opacity-30" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-warn" />
                  Fear & Greed
                </div>
                <span className="text-[11px] text-muted-foreground">Realtime</span>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <div className="text-5xl font-bold num">{fgIndex}</div>
                <div className="pb-2 text-xs font-medium text-warn uppercase tracking-wider">Greed</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-bear via-warn to-bull"
                  style={{ width: `${fgIndex}%`, boxShadow: "0 0 16px oklch(0.82 0.16 78 / 50%)" }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Fear</span><span>Neutral</span><span>Greed</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass p-5 animate-fade-up">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4 text-violet" />
              AI Market Sentiment
            </div>
            <div className="mt-3 space-y-3">
              {[
                { label: "Bullish", v: 64, c: "var(--bull)" },
                { label: "Neutral", v: 22, c: "var(--info)" },
                { label: "Bearish", v: 14, c: "var(--bear)" },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="num">{r.v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.v}%`, background: r.c, boxShadow: `0 0 12px ${r.c}` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              Model confidence <span className="text-foreground num">87%</span> · Updated 12s ago across 4,318 sources.
            </div>
          </div>
        </div>
      </div>

      {/* Indices */}
      <div className="rounded-2xl glass p-5 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Major Indices</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <LiveDot /> Streaming
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INDICES.map((idx) => {
            const up = idx.changePct >= 0;
            const data = Array.from({ length: 24 }, () => Math.random());
            return (
              <div key={idx.symbol} className="rounded-xl hairline bg-surface-1 p-3 hover:bg-surface-2 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground">{idx.symbol}</div>
                    <div className="text-xs font-medium">{idx.name}</div>
                  </div>
                  {up ? <TrendingUp className="h-3.5 w-3.5 text-bull" /> : <TrendingDown className="h-3.5 w-3.5 text-bear" />}
                </div>
                <div className="mt-2 text-lg font-semibold num">{fmtMoney(idx.price)}</div>
                <div className="mt-1 flex items-center justify-between">
                  <Delta value={idx.changePct} />
                  <Sparkline data={data} positive={up} width={48} height={20} fill={false} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Movers + Heatmap */}
      <div className="grid lg:grid-cols-3 gap-4">
        <MoversCard title="Top Gainers" icon={TrendingUp} accent="bull" rows={gainers} />
        <MoversCard title="Top Losers" icon={TrendingDown} accent="bear" rows={losers} />
        <MoversCard title="Volume Movers" icon={Activity} accent="violet" rows={movers} showVol />
      </div>

      {/* Sector heatmap */}
      <div className="rounded-2xl glass p-5 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Sector Performance</div>
            <div className="text-[11px] text-muted-foreground">% change today</div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet" />
            AI clustering active
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {SECTORS.map((s) => {
            const up = s.changePct >= 0;
            const intensity = Math.min(1, Math.abs(s.changePct) / 2.5);
            const bg = up
              ? `oklch(0.78 0.18 152 / ${0.10 + intensity * 0.35})`
              : `oklch(0.66 0.22 22 / ${0.10 + intensity * 0.35})`;
            return (
              <div
                key={s.name}
                className="rounded-xl p-3 hairline transition hover:scale-[1.02]"
                style={{ background: bg }}
              >
                <div className="text-[11px] font-medium leading-tight">{s.name}</div>
                <div className={`mt-2 text-lg font-semibold num ${up ? "text-bull" : "text-bear"}`}>
                  {up ? "+" : ""}{s.changePct.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MoversCard({
  title, icon: Icon, accent, rows, showVol,
}: { title: string; icon: any; accent: "bull" | "bear" | "violet"; rows: typeof QUOTES; showVol?: boolean }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : "text-violet";
  return (
    <div className="rounded-2xl glass p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          {title}
        </div>
        <span className="text-[11px] text-muted-foreground">Live</span>
      </div>
      <div className="space-y-1">
        {rows.map((q) => {
          const up = q.changePct >= 0;
          return (
            <div key={q.symbol} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2 transition">
              <div className="h-8 w-8 rounded-md bg-surface-2 hairline grid place-items-center text-[10px] font-bold">
                {q.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold">{q.symbol}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {showVol ? `Vol ${fmtCompact(q.volume)}` : q.name}
                </div>
              </div>
              <Sparkline data={q.spark} positive={up} width={56} height={22} />
              <div className="text-right min-w-[64px]">
                <div className="text-xs num">{fmtMoney(q.price)}</div>
                <div className={`text-[10px] num ${up ? "text-bull" : "text-bear"}`}>
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
