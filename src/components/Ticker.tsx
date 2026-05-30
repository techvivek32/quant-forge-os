import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getMarketSnapshot } from "@/lib/api/ibkr";
import { fmtMoney } from "@/lib/market-data";

const TICKER_SYMBOLS = [
  { symbol: "AAPL", conid: 265598 },
  { symbol: "MSFT", conid: 272093 },
  { symbol: "NVDA", conid: 4815747 },
  { symbol: "GOOGL", conid: 208813720 },
  { symbol: "AMZN", conid: 3691937 },
  { symbol: "META", conid: 107113386 },
  { symbol: "TSLA", conid: 76792991 },
  { symbol: "JPM", conid: 1520593 },
  { symbol: "V", conid: 4815747 },
  { symbol: "UNH", conid: 208813720 },
  { symbol: "AVGO", conid: 272093 },
  { symbol: "NFLX", conid: 14958181 },
  { symbol: "AMD", conid: 4391 },
  { symbol: "INTC", conid: 270639 },
  { symbol: "DIS", conid: 2877 },
];

export function Ticker() {
  const navigate = useNavigate();
  
  const { data: quotes = [] } = useQuery({
    queryKey: ["ticker-quotes"],
    queryFn: () => getMarketSnapshot(TICKER_SYMBOLS.map(s => s.conid)),
    refetchInterval: 3_000,
    staleTime: 2_000,
  });

  // Enrich ticker data with real quotes
  const tickerData = TICKER_SYMBOLS.map((s) => {
    const quote = quotes.find((q) => q.conid === s.conid);
    return {
      symbol: s.symbol,
      price: quote?.last ?? 0,
      changePct: quote?.changePct ?? 0,
    };
  }).filter(s => s.price > 0);

  const items = [...tickerData, ...tickerData]; // Duplicate for seamless scrolling
  return (
    <div className="relative overflow-hidden hairline-b bg-[oklch(0.17_0.013_260/0.7)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="ticker-track flex gap-8 whitespace-nowrap py-2.5">
        {items.map((q, i) => {
          const up = q.changePct >= 0;
          return (
            <div 
              key={i} 
              onClick={() => navigate({ to: `/stock/${q.symbol}` })}
              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-surface-2 rounded px-2 py-1 transition"
            >
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
