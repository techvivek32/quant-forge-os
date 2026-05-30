import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Delta, LiveDot } from "@/components/Delta";
import { fmtCompact, fmtMoney, SECTORS } from "@/lib/market-data";
import { getAccountSummary, getPositions, getMarketSnapshot, getChartData } from "@/lib/api/ibkr";
import { Activity, Brain, Flame, Gauge, Loader2, Sparkles, TrendingDown, TrendingUp, Zap } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, Cell, ComposedChart,
  Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard · NOVA Terminal" },
      { name: "description", content: "Realtime US equities terminal." },
    ],
  }),
  component: Dashboard,
});

const SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc.", conid: 265598, sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", conid: 272093, sector: "Technology" },
  { symbol: "NVDA", name: "NVIDIA Corp.", conid: 4815747, sector: "Semiconductors" },
  { symbol: "TSLA", name: "Tesla Inc.", conid: 76792991, sector: "Consumer Disc." },
  { symbol: "JPM", name: "JPMorgan Chase", conid: 1520593, sector: "Financials" },
];

const PERIODS = [
  { label: "1D", period: "1d", bar: "5min" },
  { label: "5D", period: "5d", bar: "1h" },
  { label: "1M", period: "1m", bar: "1d" },
  { label: "3M", period: "3m", bar: "1d" },
  { label: "1Y", period: "1y", bar: "1w" },
  { label: "5Y", period: "5y", bar: "1m" },
] as const;

const ALL_CONIDS = SYMBOLS.map((s) => s.conid);

function Dashboard() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<typeof PERIODS[number]>(PERIODS[0]);

  const { data: summary } = useQuery({
    queryKey: ["ibkr-summary"],
    queryFn: getAccountSummary,
    refetchInterval: 10_000,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["ibkr-positions"],
    queryFn: getPositions,
    refetchInterval: 10_000,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["ibkr-quotes"],
    queryFn: () => getMarketSnapshot(ALL_CONIDS),
    refetchInterval: 3_000,
    staleTime: 2_000,
  });

  const { data: chartData = [], isFetching: chartLoading } = useQuery({
    queryKey: ["ibkr-chart-AAPL", activePeriod.period, activePeriod.bar],
    queryFn: () => getChartData(265598, activePeriod.period, activePeriod.bar),
    refetchInterval: activePeriod.label === "1D" ? 30_000 : 300_000,
  });

  const totalPnl = positions.reduce((a, p) => a + (p.pnl ?? 0), 0);
  const netLiq = summary?.netLiquidation ?? 0;
  const buyingPower = summary?.buyingPower ?? 0;
  const openCount = positions.length;

  const enriched = SYMBOLS.map((s) => {
    const q = quotes.find((q) => q.conid === s.conid);
    return { ...s, last: q?.last ?? 0, changePct: q?.changePct ?? 0, volume: q?.volume ?? 0, updated: q?.updated ?? 0 };
  }).filter((s) => s.last > 0);

  const lastUpdated = enriched.length > 0
    ? new Date(Math.max(...enriched.map(e => e.updated))).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const gainers = [...enriched].sort((a, b) => b.changePct - a.changePct).slice(0, 4);
  const losers = [...enriched].sort((a, b) => a.changePct - b.changePct).slice(0, 4);
  const byVolume = [...enriched].sort((a, b) => b.volume - a.volume).slice(0, 4);

  const aaplQuote = enriched.find(s => s.symbol === "AAPL");

  // Chart date range label
  const chartDateLabel = chartData.length > 0
    ? activePeriod.label === "1D"
      ? new Date(chartData[0].t).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
      : `${new Date(chartData[0].t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(chartData[chartData.length - 1].t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "Loading...";

  // X axis interval based on period
  const xInterval = activePeriod.label === "1D" ? 12 : activePeriod.label === "5D" ? 4 : activePeriod.label === "1M" ? 3 : activePeriod.label === "3M" ? 5 : 8;

  // X axis date format based on period
  const xFormatter = (t: number) => {
    if (!t) return "";
    const d = new Date(t);
    if (activePeriod.label === "1D") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (activePeriod.label === "5D") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fgIndex = 72;

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Net Liquidation" value={`$${fmtMoney(netLiq)}`} delta={netLiq > 0 ? ((netLiq - 10000) / 10000) * 100 : 0} icon={Activity} accent="primary" />
        <StatCard label="Unrealized P&L" value={`${totalPnl >= 0 ? "+" : ""}$${fmtMoney(totalPnl)}`} delta={netLiq > 0 ? (totalPnl / netLiq) * 100 : 0} icon={TrendingUp} accent="bull" />
        <StatCard label="Open Positions" value={String(openCount)} icon={Gauge} accent="violet" />
        <StatCard label="Buying Power" value={`$${fmtMoney(buyingPower)}`} icon={Zap} accent="primary" />
      </div>

      {/* Chart + Sentiment */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                AAPL
                {aaplQuote && (
                  <>
                    <span className="num text-lg">${fmtMoney(aaplQuote.last)}</span>
                    <Delta value={aaplQuote.changePct} />
                  </>
                )}
                {chartLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{chartDateLabel} · {chartData.length} bars</div>
            </div>
            {/* Period Selector */}
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setActivePeriod(p)}
                  className={`px-2.5 h-7 rounded-md text-xs font-medium transition hairline ${activePeriod.label === p.label ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Price Chart */}
              <div className="h-[200px]">
                <ResponsiveContainer>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="t"
                      tickFormatter={xFormatter}
                      tick={{ fontSize: 10, fill: "oklch(0.66 0.018 255)" }}
                      axisLine={false} tickLine={false}
                      interval={xInterval}
                    />
                    <YAxis
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tick={{ fontSize: 10, fill: "oklch(0.66 0.018 255)" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${v.toFixed(0)}`}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.20 0.015 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any, name: string) => {
                        const label = name === "o" ? "Open" : name === "h" ? "High" : name === "l" ? "Low" : name === "c" ? "Close" : name;
                        return [`$${fmtMoney(Number(v))}`, label];
                      }}
                      labelFormatter={(_, payload) => {
                        const t = payload?.[0]?.payload?.t;
                        if (!t) return "";
                        const d = new Date(t);
                        if (activePeriod.label === "1D")
                          return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                        if (activePeriod.label === "5D")
                          return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                        if (activePeriod.label === "1M" || activePeriod.label === "3M")
                          return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      }}
                    />
                    <Line type="monotone" dataKey="o" stroke="oklch(0.74 0.18 235 / 0.3)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="h" stroke="oklch(0.78 0.18 152 / 0.4)" strokeWidth={1} dot={false} strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="l" stroke="oklch(0.66 0.22 22 / 0.4)" strokeWidth={1} dot={false} strokeDasharray="2 2" />
                    <Area type="monotone" dataKey="c" stroke="oklch(0.74 0.18 235)" strokeWidth={2} fill="url(#cg)" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Volume bars */}
              <div className="h-[50px]">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <YAxis hide />
                    <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.c >= d.o ? "oklch(0.78 0.18 152 / 0.6)" : "oklch(0.66 0.22 22 / 0.6)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* OHLCV Stats */}
              {(() => {
                const last = chartData[chartData.length - 1];
                const first = chartData[0];
                const high = Math.max(...chartData.map(d => d.h));
                const low = Math.min(...chartData.map(d => d.l));
                const totalVol = chartData.reduce((a, d) => a + d.v, 0);
                return (
                  <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
                    {[
                      { label: "Open", value: `$${fmtMoney(first.o)}` },
                      { label: "High", value: `$${fmtMoney(high)}`, color: "text-bull" },
                      { label: "Low", value: `$${fmtMoney(low)}`, color: "text-bear" },
                      { label: "Close", value: `$${fmtMoney(last.c)}` },
                      { label: "Volume", value: fmtCompact(totalVol) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg hairline bg-surface-1 p-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                        <div className={`font-semibold num mt-0.5 ${(s as any).color ?? ""}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Fear & Greed + Live Quotes */}
        <div className="space-y-4">
          <div className="rounded-2xl glass p-5 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-30" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-warn" /> Fear & Greed
                </div>
                <span className="text-[11px] text-muted-foreground">CNN Index</span>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <div className="text-5xl font-bold num">{fgIndex}</div>
                <div className="pb-2 text-xs font-medium text-warn uppercase tracking-wider">Greed</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-bear via-warn to-bull" style={{ width: `${fgIndex}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Fear</span><span>Neutral</span><span>Greed</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass p-5">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Brain className="h-4 w-4 text-violet" /> Live Quotes
              {lastUpdated && <span className="text-[10px] text-muted-foreground ml-auto">{lastUpdated}</span>}
            </div>
            <div className="space-y-2">
              {enriched.length === 0 ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
              ) : enriched.map((s) => (
                <div 
                  key={s.symbol} 
                  onClick={() => navigate({ to: `/stock/${s.symbol}` })}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-surface-2 rounded-lg px-2 py-1.5 transition"
                >
                  <span className="font-semibold w-12">{s.symbol}</span>
                  <span className="num text-muted-foreground">${fmtMoney(s.last)}</span>
                  <Delta value={s.changePct} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Volume Comparison */}
      {enriched.length > 0 && (
        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-info" /> Volume Comparison
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer>
              <BarChart data={enriched} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="symbol" 
                  tick={{ fontSize: 11, fill: "oklch(0.66 0.018 255)", cursor: "pointer" }} 
                  axisLine={false} 
                  tickLine={false}
                  onClick={(data) => data && navigate({ to: `/stock/${data.value}` })}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.66 0.018 255)" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.20 0.015 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [fmtCompact(Number(v)), "Volume"]}
                  cursor={{ fill: "oklch(1 0 0 / 0.05)" }}
                />
                <Bar 
                  dataKey="volume" 
                  radius={[4, 4, 0, 0]} 
                  minPointSize={4}
                  onClick={(data) => navigate({ to: `/stock/${data.symbol}` })}
                  cursor="pointer"
                >
                  {enriched.map((s) => (
                    <Cell key={s.symbol} fill={s.changePct >= 0 ? "oklch(0.78 0.18 152)" : "oklch(0.66 0.22 22)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Movers */}
      <div className="grid lg:grid-cols-3 gap-4">
        <MoversCard title="Top Gainers" icon={TrendingUp} accent="bull" rows={gainers} navigate={navigate} />
        <MoversCard title="Top Losers" icon={TrendingDown} accent="bear" rows={losers} navigate={navigate} />
        <MoversCard title="Volume Leaders" icon={Activity} accent="violet" rows={byVolume} showVol navigate={navigate} />
      </div>

      {/* Sector Heatmap */}
      <div className="rounded-2xl glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Sector Performance</div>
            <div className="text-[11px] text-muted-foreground">% change today</div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet" /> AI clustering active
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
              <div key={s.name} className="rounded-xl p-3 hairline transition hover:scale-[1.02]" style={{ background: bg }}>
                <div className="text-[11px] font-medium leading-tight">{s.name}</div>
                <div className={`mt-2 text-lg font-semibold num ${up ? "text-bull" : "text-bear"}`}>
                  {up ? "+" : ""}{s.changePct.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Positions */}
      {positions.length > 0 && (
        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-violet" /> Open Positions
            <span className="text-[11px] text-muted-foreground ml-auto">Live from IBKR</span>
          </div>
          <div className="space-y-2">
            {positions.map((p) => {
              const up = (p.pnl ?? 0) >= 0;
              return (
                <div key={p.conid} className="flex items-center justify-between rounded-xl hairline bg-surface-1 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-surface-2 grid place-items-center text-[10px] font-bold">{p.symbol?.slice(0, 2)}</div>
                    <div>
                      <div className="text-sm font-semibold">{p.symbol}</div>
                      <div className="text-[11px] text-muted-foreground">{p.quantity} @ ${fmtMoney(p.entryPrice)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold num ${up ? "text-bull" : "text-bear"}`}>{up ? "+" : ""}${fmtMoney(p.pnl ?? 0)}</div>
                    <Delta value={p.pnlPct} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, delta, icon: Icon, accent = "primary" }: {
  label: string; value: string; delta?: number; icon: any; accent?: "primary" | "bull" | "bear" | "violet";
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
    <div className="relative overflow-hidden rounded-2xl glass p-5">
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
          <span className="text-xs text-muted-foreground">vs. open</span>
        </div>
      )}
    </div>
  );
}

function MoversCard({ title, icon: Icon, accent, rows, showVol, navigate }: {
  title: string; icon: any; accent: "bull" | "bear" | "violet";
  rows: any[]; showVol?: boolean; navigate: any;
}) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : "text-violet";
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} /> {title}
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><LiveDot /> Live</span>
      </div>
      {rows.length === 0 ? (
        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-1">
          {rows.map((q) => {
            const up = q.changePct >= 0;
            return (
              <div 
                key={q.symbol} 
                onClick={() => navigate({ to: `/stock/${q.symbol}` })}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2 transition cursor-pointer"
              >
                <div className="h-8 w-8 rounded-md bg-surface-2 hairline grid place-items-center text-[10px] font-bold">{q.symbol.slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{q.symbol}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {showVol ? `Vol ${fmtCompact(q.volume)}` : q.name}
                  </div>
                </div>
                <div className="text-right min-w-[72px]">
                  <div className="text-xs num">${fmtMoney(q.last)}</div>
                  <div className={`text-[10px] num ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "+" : ""}{q.changePct.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
