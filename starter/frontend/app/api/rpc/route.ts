const ALLOWED_METHODS = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_call",
  "eth_getBalance",
  "eth_getCode",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_getTransactionCount",
  "eth_getLogs",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
]);

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > 100_000)
      return Response.json({ error: "RPC request is too large." }, { status: 413 });
    const body: unknown = JSON.parse(rawBody);
    const calls: unknown[] = Array.isArray(body) ? body : [body];
    if (
      calls.length === 0 ||
      calls.length > 20 ||
      calls.some(
        (call) =>
          !call ||
          typeof call !== "object" ||
          !("method" in call) ||
          typeof call.method !== "string" ||
          !ALLOWED_METHODS.has(call.method),
      )
    ) {
      return Response.json({ error: "Unsupported RPC method or batch size." }, { status: 400 });
    }
    const upstream = new URL(
      process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    );
    if (upstream.protocol !== "https:") throw new Error("RPC must use HTTPS.");
    const response = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Sepolia RPC is unavailable. Retry or configure another server-side RPC URL." },
      { status: 502 },
    );
  }
}
