type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GENERATOR: { fetch(request: Request): Promise<Response> };
};
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/make")
      return Response.redirect(new URL("/", url).href, 301);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (!["/api/generate-step", "/api/status"].includes(url.pathname))
      return json({ error: "Not found" }, 404);
    if (url.pathname === "/api/generate-step") {
      if (request.method !== "POST") return json({ error: "Use POST" }, 405);
      if (request.headers.get("Origin") !== url.origin)
        return json({ error: "Use Jevbox to make a beat." }, 403);
    } else if (request.method !== "GET") return json({ error: "Use GET" }, 405);
    const upstream = new URL(url.pathname, "https://beatbox.grahammiles.me");
    const forwarded = new Request(upstream, new Request(request));
    forwarded.headers.set("Origin", upstream.origin);
    try {
      const response = await env.GENERATOR.fetch(forwarded);
      const data = (await response.json()) as Record<string, unknown>;
      for (const key of ["error", "message"])
        if (typeof data[key] === "string")
          data[key] = data[key].replaceAll("TypeSafe", "Jev");
      const result = json(data, response.status);
      const retry = response.headers.get("Retry-After");
      if (retry) result.headers.set("Retry-After", retry);
      return result;
    } catch {
      return json(
        {
          error:
            "Jev could not finish this time. Your beat is unchanged. Try again.",
        },
        502,
      );
    }
  },
};
