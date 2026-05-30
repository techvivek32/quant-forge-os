const BASE = "/ibkr";
const ACCOUNT = import.meta.env.VITE_IBKR_ACCOUNT_ID ?? "U25901412";

let sessionReady = false;

async function ibkr<T>(path: string, options?: RequestInit): Promise<T> {
  // Initialize session on first call
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
    // Re-tickle and retry once
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

// Keep session alive — call every 60s
export async function tickle() {
  return ibkr<{ session: string; ssoExpires: number }>("/tickle", { method: "POST" });
}

// Account summary — equity, buying power, margin
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

// Open positions
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

// Live orders
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

// Place order
export async function placeOrder(symbol: string, side: "BUY" | "SELL", qty: number, orderType: string, price?: number, stop?: number, tp?: number) {
  // First get conid for symbol
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

  // Bracket order
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

// Cancel order
export async function cancelOrder(orderId: string) {
  return ibkr<any>(`/iserver/account/${ACCOUNT}/order/${orderId}`, { method: "DELETE" });
}

// Known conids for major symbols
export const CONIDS: Record<string, number> = {
  AAPL: 265598, MSFT: 272093, NVDA: 107113386, GOOGL: 208813720,
  AMZN: 3691937, META: 107113386, TSLA: 76792991, JPM: 1520593,
  SPX: 416904, NDX: 825720, VIX: 13455763,
};

// Get market data snapshot for multiple conids
export async function getMarketSnapshot(conids: number[]) {
  const data = await ibkr<any[]>(`/iserver/marketdata/snapshot?conids=${conids.join(",")}&fields=31,83,84,85,86,87,88`);
  return (data ?? []).map((d) => ({
    conid: d.conid,
    last: parseFloat(d["31"] ?? "0"),
    changePct: parseFloat(d["83"] ?? "0"),
    bid: parseFloat(d["84"] ?? "0"),
    ask: parseFloat(d["85"] ?? "0"),
    volume: parseInt(d["86"] ?? "0"),
    open: parseFloat(d["88"] ?? "0"),
  }));
}

// Auth status
export async function getAuthStatus() {
  return ibkr<{ authenticated: boolean; connected: boolean; competing: boolean }>("/iserver/auth/status");
}
