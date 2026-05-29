import { createFileRoute } from "@tanstack/react-router";
import { Delta } from "@/components/Delta";
import { Brain, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Area, AreaChart, XAxis, YAxis } from "recharts";
import { fmtMoney } from "@/lib/market-data";

export const Route = createFileRoute("/_app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · NOVA" }, { name: "description", content: "Portfolio intelligence — P&L, exposure, allocation, and AI risk." }] }),
  component: Portfolio,
});

const allocation = [
  { name: "Technology", value: 38, color: "oklch(0.74 0.18 235)" },
  { name: "Semis", value: 22, color: "oklch(0.70 0.18 295)" },
  { name: "Financials", value: 14, color: "oklch(0.78 0.18 152)" },
  { name: "Healthcare", value: 10, color: "oklch(0.82 0.16 78)" },
  { name: "Energy", value: 8, color: "oklch(0.66 0.22 22)" },
  { name: "Cash", value: 8, color: "oklch(0.45 0.02 260)" },
];

const perf = Array.from({ length: 90 }, (_, i) => ({
  t: i,
  v: 100 + Math.sin(i / 6) * 6 + i * 0.18,
  spx: 100 + Math.sin(i / 7) * 4 + i * 0.10,
}));

function Portfolio() {
  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Equity" value={`$${fmtMoney(124_582.34)}`} delta={12.4} icon={Wallet} />
        <Kpi label="Unrealized P&L" value="+$8,214.10" delta={7.18} icon={TrendingUp} />
        <Kpi label="Realized YTD" value="+$22,108.55" delta={28.3} icon={TrendingUp} />
        <Kpi label="Portfolio Beta" value="1.12" delta={-0.04} icon={ShieldAlert} suffix="" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Performance vs S&P 500</div>
              <div className="text-xs text-muted-foreground">Indexed · last 90 days</div>
            </div>
            <div className="flex gap-3 text-[11px]">
              <Legend color="var(--info)" label="Portfolio" />
              <Legend color="oklch(0.66 0.018 255)" label="SPX" />
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <AreaChart data={perf}>
                <defs>
                  <linearGradient id="pp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.20 0.015 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="spx" stroke="oklch(0.66 0.018 255)" strokeWidth={1.5} fill="transparent" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="v" stroke="oklch(0.74 0.18 235)" strokeWidth={2} fill="url(#pp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-semibold mb-3">Sector Allocation</div>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocation} dataKey="value" innerRadius={45} outerRadius={70} stroke="none">
                  {allocation.map((a) => <Cell key={a.name} fill={a.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.20 0.015 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {allocation.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-muted-foreground">{a.name}</span>
                </div>
                <span className="num">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI insights */}
      <div className="rounded-2xl glass p-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet/10 blur-3xl" />
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-md gradient-primary grid place-items-center"><Brain className="h-4 w-4 text-background" /></div>
          <div className="text-sm font-semibold">AI Portfolio Analysis</div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Updated 38s ago</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { tone: "warn", title: "Tech exposure elevated", body: "60% in Tech + Semis. Consider partial hedge with sector-uncorrelated names.", score: 72 },
            { tone: "bull", title: "Momentum aligned", body: "9 of 14 holdings above 50/200 EMA. Trend regime favorable.", score: 84 },
            { tone: "bear", title: "Volatility cluster", body: "Realized vol spiked 18% above 30d avg. Tighten stops on AMD, NVDA.", score: 61 },
          ].map((c, i) => {
            const color = c.tone === "bull" ? "text-bull" : c.tone === "bear" ? "text-bear" : "text-warn";
            return (
              <div key={i} className="rounded-xl hairline bg-surface-1 p-4">
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-semibold ${color} uppercase tracking-wider`}>{c.tone === "bull" ? "Opportunity" : c.tone === "bear" ? "Risk" : "Caution"}</div>
                  <span className="text-[10px] num text-muted-foreground">Conf {c.score}%</span>
                </div>
                <div className="mt-1.5 text-sm font-medium">{c.title}</div>
                <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, icon: Icon, suffix = "%" }: { label: string; value: string; delta: number; icon: any; suffix?: string }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold num">{value}</div>
        </div>
        <div className="h-9 w-9 rounded-lg bg-surface-2 grid place-items-center hairline"><Icon className="h-4 w-4 text-info" /></div>
      </div>
      <div className="mt-3"><Delta value={delta} suffix={suffix} /></div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>;
}
