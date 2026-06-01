import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Loader2, Zap, AlertTriangle, Bell, BookmarkPlus } from "lucide-react";
import { ResponsiveContainer, ComposedChart, BarChart, Line, Area, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";
import { ChartDrawingTools, AdvancedIndicators, enhanceDataWithIndicators, type DrawingTool, type Drawing } from "@/components/ChartTools";
import { CandlestickChart } from "@/components/CandlestickChart";
import { getChartData, getMarketSnapshot, CONIDS } from "@/lib/api/ibkr";
import { fmtMoney } from "@/lib/market-data";

export const Route = createFileRoute("/_app/stock/$symbol")({
  component: StockDetail,
});

const PERIODS = [
  { label: "1D", days: 1, period: "1d", bar: "5min" },
  { label: "5D", days: 5, period: "1w", bar: "1h" },
  { label: "1M", days: 30, period: "1m", bar: "1d" },
  { label: "3M", days: 90, period: "3m", bar: "1d" },
  { label: "6M", days: 180, period: "6m", bar: "1d" },
  { label: "1Y", days: 365, period: "1y", bar: "1w" },
];

const CHART_TYPES = ["Line", "Candlestick", "Area"] as const;
const INDICATORS = ["SMA", "EMA", "BB", "RSI", "MACD", "ATR", "OBV", "Volume"] as const;

function StockDetail() {
  const { symbol } = Route.useParams();
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState(PERIODS[0]);
  const [chartType, setChartType] = useState<typeof CHART_TYPES[number]>("Candlestick");
  const [indicators, setIndicators] = useState<string[]>(["Volume"]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("100");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartContainerRef, setChartContainerRef] = useState<HTMLDivElement | null>(null);
  const [yDomain, setYDomain] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetchQuote();
    fetchChartData();
    const interval = setInterval(fetchQuote, 1000);
    return () => clearInterval(interval);
  }, [symbol, activePeriod]);

  const fetchQuote = async () => {
    try {
      const conid = CONIDS[symbol as string];
      if (!conid) {
        console.error(`Symbol ${symbol} not found in CONIDS`);
        return;
      }
      const data = await getMarketSnapshot([conid]);
      if (data && data.length > 0) {
        const q = data[0];
        
        // Calculate high/low from chart data if available
        let high = q.last * 1.02;
        let low = q.last * 0.98;
        if (chartData.length > 0) {
          high = Math.max(...chartData.map(d => d.h));
          low = Math.min(...chartData.map(d => d.l));
        }
        
        setQuote({
          last: q.last,
          open: q.open || q.last,
          high,
          low,
          prevClose: q.last / (1 + q.changePct / 100),
          volume: q.volume,
          bid: q.bid,
          ask: q.ask,
        });
        if (!limitPrice) setLimitPrice(q.last?.toFixed(2) || "");
      }
    } catch (err) {
      console.error("Quote fetch error:", err);
    }
  };

  const fetchChartData = async () => {
    try {
      const conid = CONIDS[symbol as string];
      if (!conid) {
        console.error(`Symbol ${symbol} not found in CONIDS`);
        setLoading(false);
        return;
      }
      console.log(`Fetching chart data for ${symbol} (${conid}): period=${activePeriod.period}, bar=${activePeriod.bar}`);
      const data = await getChartData(conid, activePeriod.period, activePeriod.bar);
      console.log(`Received ${data.length} bars:`, data.slice(0, 3));
      const enhanced = enhanceDataWithIndicators(data);
      setChartData(enhanced);
      
      // Calculate Y domain for candlestick alignment
      if (enhanced.length > 0) {
        const yMin = Math.min(...enhanced.map(d => d.l));
        const yMax = Math.max(...enhanced.map(d => d.h));
        const padding = (yMax - yMin) * 0.05;
        setYDomain([yMin - padding, yMax + padding]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Chart fetch error:", err);
      setLoading(false);
    }
  };



  const calculateRSI = (data: any[], idx: number, period: number) => {
    if (idx < period) return null;
    let gains = 0, losses = 0;
    for (let i = idx - period + 1; i <= idx; i++) {
      const change = data[i].c - data[i - 1]?.c || 0;
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  const createAlert = () => {
    const alertPrice = prompt(`Create price alert for ${symbol}:`);
    if (alertPrice) {
      setAlerts([...alerts, { price: parseFloat(alertPrice), timestamp: Date.now() }]);
    }
  };

  const addToWatchlist = () => {
    alert(`${symbol} added to watchlist!`);
  };

  const placeOrder = async () => {
    try {
      alert(`Order placed: ${orderSide.toUpperCase()} ${quantity} ${symbol} at ${orderType === "limit" ? `$${limitPrice}` : "market"}`);
      // TODO: Integrate with IBKR placeOrder API
    } catch (err) {
      console.error("Order error:", err);
    }
  };

  const xFormatter = (t: number) => {
    if (!t) return "";
    const d = new Date(t);
    if (activePeriod.label === "1D") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const changePct = quote ? ((quote.last - quote.prevClose) / quote.prevClose) * 100 : 0;
  const isPositive = changePct >= 0;

  if (loading && !quote) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading {symbol}...</p>
        </div>
      </div>
    );
  }

  if (!CONIDS[symbol as string]) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-warn mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Symbol Not Found</h2>
          <p className="text-muted-foreground mb-4">The symbol {symbol} is not available yet.</p>
          <button 
            onClick={() => navigate({ to: "/" })} 
            className="px-4 h-10 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate({ to: "/" })} className="p-2 rounded-lg hover:bg-surface-2 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{symbol}</h1>
            {quote && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold num">${quote.last?.toFixed(2)}</span>
                <span className={`flex items-center gap-1 text-base font-semibold ${isPositive ? "text-bull" : "text-bear"}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={createAlert} className="px-4 h-10 rounded-lg bg-surface-2 hover:bg-surface-3 transition flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4" /> Alert
          </button>
          <button onClick={addToWatchlist} className="px-4 h-10 rounded-lg bg-surface-2 hover:bg-surface-3 transition flex items-center gap-2 text-sm font-medium">
            <BookmarkPlus className="h-4 w-4" /> Watchlist
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl glass p-5">
            {/* Chart Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setActivePeriod(p)}
                    className={`px-3 h-8 rounded-md text-xs font-medium transition ${activePeriod.label === p.label ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 h-8 rounded-md text-xs font-medium transition ${chartType === type ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {INDICATORS.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])}
                  className={`px-3 h-7 rounded-md text-xs font-medium transition ${indicators.includes(ind) ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground hover:bg-surface-2"}`}
                >
                  {ind}
                </button>
              ))}
            </div>

            {/* Drawing Tools */}
            <div className="mb-4">
              <ChartDrawingTools 
                activeTool={activeTool} 
                setActiveTool={setActiveTool}
                drawings={drawings}
                setDrawings={setDrawings}
              />
            </div>

            {/* Main Chart */}
            <div className="h-[300px] relative" ref={setChartContainerRef}>
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.74 0.18 235)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="t" 
                      tickFormatter={xFormatter} 
                      tick={{ fontSize: 10, fill: "oklch(0.66 0.018 255)" }} 
                      axisLine={false} 
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={yDomain[0] !== 0 ? yDomain : ["dataMin - 1", "dataMax + 1"]} 
                      tick={{ fontSize: 10, fill: "oklch(0.66 0.018 255)" }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(v) => `$${v.toFixed(0)}`} 
                      width={60} 
                    />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.20 0.015 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any, name: string) => {
                        if (name === "o") return [`$${Number(v).toFixed(2)}`, "Open"];
                        if (name === "h") return [`$${Number(v).toFixed(2)}`, "High"];
                        if (name === "l") return [`$${Number(v).toFixed(2)}`, "Low"];
                        if (name === "c") return [`$${Number(v).toFixed(2)}`, "Close"];
                        return [`$${Number(v).toFixed(2)}`];
                      }}
                      labelFormatter={(t) => {
                        const d = new Date(t);
                        return d.toLocaleString("en-US", { 
                          month: "short", 
                          day: "numeric", 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        });
                      }}
                    />
                    
                    {chartType === "Line" && (
                      <Line type="monotone" dataKey="c" stroke="oklch(0.74 0.18 235)" strokeWidth={2} dot={false} />
                    )}
                    
                    {chartType === "Area" && (
                      <Area type="monotone" dataKey="c" stroke="oklch(0.74 0.18 235)" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                    )}
                    
                    {chartType === "Candlestick" && (
                      <>
                        <Line type="monotone" dataKey="h" stroke="transparent" dot={false} connectNulls />
                        <Line type="monotone" dataKey="l" stroke="transparent" dot={false} connectNulls />
                      </>
                    )}
                    
                    {indicators.includes("BB") && (
                      <>
                        <Line type="monotone" dataKey="bbUpper" stroke="oklch(0.66 0.22 22)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="bbLower" stroke="oklch(0.78 0.18 152)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                      </>
                    )}
                    {indicators.includes("SMA") && <Line type="monotone" dataKey="sma20" stroke="oklch(0.78 0.18 152)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />}
                    {indicators.includes("EMA") && <Line type="monotone" dataKey="ema12" stroke="oklch(0.74 0.18 52)" strokeWidth={1.5} dot={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Candlestick Overlay */}
            {chartType === "Candlestick" && chartData.length > 0 && chartContainerRef && (
              <div style={{ 
                position: "absolute", 
                top: 155, 
                left: 80, 
                right: 8, 
                height: 300,
                pointerEvents: "none"
              }}>
                <CandlestickChart 
                  data={chartData}
                  width={chartContainerRef.offsetWidth - 68}
                  height={280}
                  yDomain={yDomain}
                />
              </div>
            )}

            {/* Volume Chart */}
            {indicators.includes("Volume") && (
              <div className="h-[60px] mt-2">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <YAxis hide />
                    <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.c >= d.o ? "oklch(0.78 0.18 152 / 0.5)" : "oklch(0.66 0.22 22 / 0.5)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* RSI Indicator */}
            {indicators.includes("RSI") && (
              <div className="h-[80px] mt-2">
                <ResponsiveContainer>
                  <ComposedChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={40} />
                    <ReferenceLine y={70} stroke="oklch(0.66 0.22 22)" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="oklch(0.78 0.18 152)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="rsi" stroke="oklch(0.74 0.18 285)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Technical Analysis */}
          <div className="rounded-2xl glass p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Technical Analysis
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "RSI (14)", value: chartData[chartData.length - 1]?.rsi?.toFixed(1) || "—", signal: (chartData[chartData.length - 1]?.rsi || 50) > 70 ? "Overbought" : (chartData[chartData.length - 1]?.rsi || 50) < 30 ? "Oversold" : "Neutral" },
                { label: "SMA (20)", value: `$${chartData[chartData.length - 1]?.sma20?.toFixed(2) || "—"}`, signal: quote?.last > (chartData[chartData.length - 1]?.sma20 || 0) ? "Bullish" : "Bearish" },
                { label: "EMA (12)", value: `$${chartData[chartData.length - 1]?.ema12?.toFixed(2) || "—"}`, signal: quote?.last > (chartData[chartData.length - 1]?.ema12 || 0) ? "Bullish" : "Bearish" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg hairline bg-surface-1 p-3">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-semibold num mt-1">{item.value}</div>
                  <div className={`text-xs mt-1 ${item.signal.includes("Bull") || item.signal === "Oversold" ? "text-bull" : item.signal.includes("Bear") || item.signal === "Overbought" ? "text-bear" : "text-muted-foreground"}`}>
                    {item.signal}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Advanced Indicators */}
            <AdvancedIndicators data={chartData} indicators={indicators} />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="space-y-4">
          {/* Quote Stats */}
          <div className="rounded-2xl glass p-5">
            <h3 className="text-sm font-semibold mb-3">Market Data</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Open", value: `$${quote?.open?.toFixed(2) || "—"}` },
                { label: "High", value: `$${quote?.high?.toFixed(2) || "—"}`, color: "text-bull" },
                { label: "Low", value: `$${quote?.low?.toFixed(2) || "—"}`, color: "text-bear" },
                { label: "Volume", value: quote?.volume?.toLocaleString() || "—" },
                { label: "Prev Close", value: `$${quote?.prevClose?.toFixed(2) || "—"}` },
                { label: "Bid", value: `$${quote?.bid?.toFixed(2) || "—"}` },
                { label: "Ask", value: `$${quote?.ask?.toFixed(2) || "—"}` },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className={`font-semibold num ${(stat as any).color || ""}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Entry */}
          <div className="rounded-2xl glass p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Place Order
            </h3>
            
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setOrderSide("buy")}
                className={`h-10 rounded-lg font-semibold transition ${orderSide === "buy" ? "bg-bull text-white" : "bg-surface-2 text-muted-foreground"}`}
              >
                BUY
              </button>
              <button
                onClick={() => setOrderSide("sell")}
                className={`h-10 rounded-lg font-semibold transition ${orderSide === "sell" ? "bg-bear text-white" : "bg-surface-2 text-muted-foreground"}`}
              >
                SELL
              </button>
            </div>

            {/* Order Type */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Order Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="w-full h-10 rounded-lg bg-surface-2 px-3 text-sm"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-10 rounded-lg bg-surface-2 px-3 text-sm"
                placeholder="100"
              />
            </div>

            {/* Limit Price */}
            {orderType === "limit" && (
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Limit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full h-10 rounded-lg bg-surface-2 px-3 text-sm"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Stop Price */}
            {orderType === "stop" && (
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Stop Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="w-full h-10 rounded-lg bg-surface-2 px-3 text-sm"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Order Summary */}
            <div className="rounded-lg bg-surface-2 p-3 mb-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Total</span>
                <span className="font-semibold num">
                  ${((orderType === "limit" ? parseFloat(limitPrice) : quote?.last || 0) * parseInt(quantity || "0")).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={placeOrder}
              className={`w-full h-11 rounded-lg font-semibold transition ${orderSide === "buy" ? "bg-bull hover:bg-bull/90" : "bg-bear hover:bg-bear/90"} text-white`}
            >
              {orderSide === "buy" ? "BUY" : "SELL"} {symbol}
            </button>

            <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Trading involves risk. This is a simulated environment.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
