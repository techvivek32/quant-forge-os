import { createAPIFileRoute } from "@tanstack/react-start/api";

const IBKR_BACKEND = "https://backend.nassphx.com";

export const APIRoute = createAPIFileRoute("/api/ibkr/$")({
  GET: ({ request }) => proxyRequest(request),
  POST: ({ request }) => proxyRequest(request),
  DELETE: ({ request }) => proxyRequest(request),
  PUT: ({ request }) => proxyRequest(request),
});

async function proxyRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Strip /api/ibkr prefix, forward the rest as /v1/api/...
  const upstreamPath = url.pathname.replace(/^\/api\/ibkr/, "/v1/api");
  const upstreamUrl = `${IBKR_BACKEND}${upstreamPath}${url.search}`;

  const headers = new Headers();
  // Forward cookies so the IBKR session is passed through
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  headers.set("origin", IBKR_BACKEND);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    // @ts-ignore — needed for Node/Cloudflare runtimes to stream body
    duplex: "half",
  };

  const upstream = await fetch(upstreamUrl, init);

  const responseHeaders = new Headers();
  responseHeaders.set("content-type", upstream.headers.get("content-type") ?? "application/json");
  // Forward any new session cookies back to the browser
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      responseHeaders.append("set-cookie", value);
    }
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
