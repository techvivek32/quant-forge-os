const BASE = "/ibkr";
const ACCOUNT = import.meta.env.VITE_IBKR_ACCOUNT_ID ?? "U25901412";

let sessionReady = false;

async function ibkr<T>(path: string, options?: RequestInit): Promise<T> {
  if (!sessionReady) {
    await fetch(`${BASE}/tickle`, { method: "POST", credentials: "include" }).catch(() => {});
    sessionReady = true;
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (res.status === 401) {
    sessionReady = false;
    await fetch(`${BASE}/tickle`, { method: "POST", credentials: "include" }).catch(() => {});
    const retry = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!retry.ok) throw new Error(`IBKR ${path} → ${retry.status}`);
    return retry.json();
  }
  if (!res.ok) throw new Error(`IBKR ${path} → ${res.status}`);
  return res.json();
}

export async function tickle() {
  return ibkr<{ session: string; ssoExpires: number }>("/tickle", { method: "POST" });
}

export async function getAuthStatus() {
  return ibkr<{ authenticated: boolean; connected: boolean; competing: boolean }>("/iserver/auth/status");
}

export async function getAccountSummary() {
  const data = await ibkr<Record<string, { amount: number; currency: string }>>(`/portfolio/${ACCOUNT}/summary`);
  return {
    netLiquidation: data["netliquidation"]?.amount ?? 0,
    buyingPower: data["buyingpower"]?.amount ?? 0,
    availableFunds: data["availablefunds"]?.amount ?? 0,
    initMarginReq: data["initmarginreq"]?.amount ?? 0,
    maintMarginReq: data["maintmarginreq"]?.amount ?? 0,
    excessLiquidity: data["excessliquidity"]?.amount ?? 0,
    totalCash: data["totalcashvalue"]?.amount ?? 0,
    unrealizedPnl: data["unrealizedpnl"]?.amount ?? 0,
    realizedPnl: data["realizedpnl"]?.amount ?? 0,
  };
}

export async function getPositions() {
  const data = await ibkr<any[]>(`/portfolio/${ACCOUNT}/positions/0`);
  return (data ?? []).map((p) => ({
    conid: p.conid,
    symbol: p.ticker ?? p.contractDesc,
    name: p.contractDesc,
    quantity: p.position,
    entryPrice: p.avgCost,
    currentPrice: p.mktPrice,
    marketValue: p.mktValue,
    pnl: p.unrealizedPnl,
    pnlPct: p.avgCost > 0 ? ((p.mktPrice - p.avgCost) / p.avgCost) * 100 : 0,
    side: p.position > 0 ? "LONG" : "SHORT",
    sector: p.sector ?? "",
    assetClass: p.assetClass ?? "STK",
  }));
}

export async function getOrders() {
  const data = await ibkr<{ orders: any[] }>("/iserver/account/orders");
  return (data?.orders ?? []).map((o) => ({
    orderId: o.orderId,
    symbol: o.ticker ?? o.symbol,
    side: o.side === "B" ? "BUY" : "SELL",
    type: o.orderType,
    quantity: o.totalSize,
    price: o.price ?? o.auxPrice,
    status: mapStatus(o.status),
    time: new Date(o.lastExecutionTime_r ?? Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  }));
}

function mapStatus(s: string) {
  if (["Submitted", "PreSubmitted"].includes(s)) return "Working";
  if (s === "Filled") return "Filled";
  if (s === "Cancelled") return "Canceled";
  return "Rejected";
}

export async function placeOrder(symbol: string, side: "BUY" | "SELL", qty: number, orderType: string, price?: number, stop?: number, tp?: number) {
  const search = await ibkr<any[]>(`/iserver/secdef/search?symbol=${symbol}&name=false&secType=STK`);
  const conid = search?.[0]?.conid;
  if (!conid) throw new Error(`Symbol ${symbol} not found`);

  const orders: any[] = [{
    conid,
    orderType: orderType === "MKT" ? "MKT" : orderType === "STP" ? "STP" : "LMT",
    side,
    quantity: qty,
    tif: "DAY",
    ...(price && orderType !== "MKT" ? { price } : {}),
    ...(stop ? { auxPrice: stop } : {}),
  }];

  if (stop && tp) {
    orders.push(
      { conid, orderType: "STP", side: side === "BUY" ? "SELL" : "BUY", quantity: qty, auxPrice: stop, tif: "GTC" },
      { conid, orderType: "LMT", side: side === "BUY" ? "SELL" : "BUY", quantity: qty, price: tp, tif: "GTC" }
    );
  }

  return ibkr<any[]>(`/iserver/account/${ACCOUNT}/orders`, {
    method: "POST",
    body: JSON.stringify({ orders }),
  });
}

export async function cancelOrder(orderId: string) {
  return ibkr<any>(`/iserver/account/${ACCOUNT}/order/${orderId}`, { method: "DELETE" });
}

export const CONIDS: Record<string, number> = {
  // Major Tech Stocks - REAL IBKR CONIDs
  AAPL: 265598,     // Apple Inc - VERIFIED
  MSFT: 272093,     // Microsoft Corp - VERIFIED
  NVDA: 4815747,    // NVIDIA Corp - VERIFIED
  GOOGL: 208813719, // Alphabet Inc Class A - VERIFIED
  GOOG: 208813720,  // Alphabet Inc Class C - VERIFIED
  AMZN: 3691937,    // Amazon.com Inc - VERIFIED
  META: 107113386,  // Meta Platforms Inc - VERIFIED
  TSLA: 76792991,   // Tesla Inc - VERIFIED
  NFLX: 15124833,   // Netflix Inc - VERIFIED
  AMD: 4391,        // Advanced Micro Devices - VERIFIED
  V: 49462172,      // Visa Inc Class A - VERIFIED
  JPM: 1520593,     // JPMorgan Chase & Co - VERIFIED
  
  // Need to fetch these CONIDs
  INTC: 270639,     // Intel Corp (need to verify)
  ORCL: 272093,     // Oracle Corp (placeholder)
  ADBE: 272093,     // Adobe Inc (placeholder)
  CRM: 208813720,   // Salesforce Inc (placeholder)
  
  // Financial Stocks
  MA: 272093,       // Mastercard Inc (placeholder)
  BAC: 208813720,   // Bank of America (placeholder)
  WFC: 3691937,     // Wells Fargo (placeholder)
  GS: 107113386,    // Goldman Sachs (placeholder)
  AXP: 76792991,    // American Express (placeholder)
  
  // Healthcare & Pharma
  UNH: 208813720,   // UnitedHealth Group (placeholder)
  JNJ: 4815747,     // Johnson & Johnson (placeholder)
  PFE: 272093,      // Pfizer Inc (placeholder)
  ABBV: 3691937,    // AbbVie Inc (placeholder)
  LLY: 107113386,   // Eli Lilly (placeholder)
  TMO: 76792991,    // Thermo Fisher (placeholder)
  
  // Industrial & Energy
  AVGO: 272093,     // Broadcom Inc (placeholder)
  BA: 208813720,    // Boeing Co (placeholder)
  CAT: 3691937,     // Caterpillar Inc (placeholder)
  GE: 107113386,    // General Electric (placeholder)
  XOM: 76792991,    // Exxon Mobil (placeholder)
  CVX: 4815747,     // Chevron Corp (placeholder)
  
  // Consumer & Retail
  WMT: 272093,      // Walmart Inc (placeholder)
  HD: 208813720,    // Home Depot (placeholder)
  PG: 3691937,      // Procter & Gamble (placeholder)
  KO: 107113386,    // Coca-Cola Co (placeholder)
  PEP: 76792991,    // PepsiCo Inc (placeholder)
  COST: 4815747,    // Costco Wholesale (placeholder)
  DIS: 2877,        // Walt Disney Co (need to verify)
  
  // Telecom & Utilities
  VZ: 4901,         // Verizon Communications - VERIFIED
  T: 208813720,     // AT&T Inc (placeholder)
  CSCO: 3691937,    // Cisco Systems (placeholder)
  NEE: 107113386,   // NextEra Energy (placeholder)
  
  // Semiconductors
  QCOM: 76792991,   // Qualcomm Inc (placeholder)
  TXN: 4815747,     // Texas Instruments (placeholder)
  INTU: 272093,     // Intuit Inc (placeholder)
  
  // Other Major Stocks
  IBM: 208813720,   // IBM Corp (placeholder)
  BABA: 147591386,  // Alibaba Group (need to verify)
  HON: 3691937,     // Honeywell International (placeholder)
  ACN: 107113386,   // Accenture PLC (placeholder)
  
  // Indices
  SPX: 416904,      // S&P 500 Index
  NDX: 825720,      // NASDAQ 100 Index
  VIX: 13455763,    // CBOE Volatility Index
};

export async function getMarketSnapshot(conids: number[]) {
  // First call subscribes to stream
  await ibkr<any[]>(`/iserver/marketdata/snapshot?conids=${conids.join(",")}&fields=31,83,84,85,86,87,88`).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));
  // Second call returns populated data
  const data = await ibkr<any[]>(`/iserver/marketdata/snapshot?conids=${conids.join(",")}&fields=31,83,84,85,86,87,88`);
  return (data ?? []).map((d) => ({
    conid: d.conid,
    last: parseFloat(d["31"] ?? "0"),
    changePct: parseFloat(d["83"] ?? "0"),
    bid: parseFloat(d["84"] ?? "0"),
    ask: parseFloat(d["85"] ?? "0"),
    volume: d["87_raw"] ? Math.round(d["87_raw"] / 100) : parseInt(d["86"] ?? "0"),
    open: parseFloat(d["88"] ?? "0"),
    updated: d["_updated"] ?? 0,
  }));
}

export async function getChartData(conid: number, period = "1d", bar = "5min") {
  const data = await ibkr<any>(`/iserver/marketdata/history?conid=${conid}&period=${period}&bar=${bar}&outsideRth=false`);
  return (data?.data ?? []).map((d: any) => ({
    t: d.t,
    o: d.o, h: d.h, l: d.l, c: d.c, v: d.v,
    time: new Date(d.t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  }));
}
