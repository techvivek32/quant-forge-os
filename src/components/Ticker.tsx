import { QUOTES, fmtMoney } from "@/lib/market-data";

export function Ticker() {
  const items = [...QUOTES, ...QUOTES];
  return (
    <div className="relative overflow-hidden hairline-b bg-[oklch(0.17_0.013_260/0.7)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="ticker-track flex gap-8 whitespace-nowrap py-2.5">
        {items.map((q, i) => {
          const up = q.changePct >= 0;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-semibold tracking-wide">{q.symbol}</span>
              <span className="num text-muted-foreground">{fmtMoney(q.price)}</span>
              <span className={`num ${up ? "text-bull" : "text-bear"}`}>
                {up ? "+" : ""}
                {q.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
