import { describe, it, expect, vi } from "vitest";
import worker from "../worker/index";
describe("Jevbox service boundary", () => {
  const make = () => ({
    ASSETS: { fetch: vi.fn(async () => new Response("app")) },
    GENERATOR: {
      fetch: vi.fn(async () =>
        Response.json(
          { error: "TypeSafe is busy" },
          { status: 503, headers: { "Retry-After": "2" } },
        ),
      ),
    },
  });
  it("rejects foreign origins before contacting generation", async () => {
    const env = make();
    const r = await worker.fetch(
      new Request("https://jevbox.grahammiles.me/api/generate-step", {
        method: "POST",
        headers: { Origin: "https://other.example" },
        body: "{}",
      }),
      env,
    );
    expect(r.status).toBe(403);
    expect(env.GENERATOR.fetch).not.toHaveBeenCalled();
  });
  it("forwards the same body privately and translates user-facing errors", async () => {
    let sent: Request | undefined;
    const env = make();
    env.GENERATOR.fetch = vi.fn(async (r: Request) => {
      sent = r;
      return Response.json(
        { error: "TypeSafe is busy" },
        { status: 503, headers: { "Retry-After": "2" } },
      );
    }) as any;
    const r = await worker.fetch(
      new Request("https://jevbox.grahammiles.me/api/generate-step", {
        method: "POST",
        headers: { Origin: "https://jevbox.grahammiles.me" },
        body: '{"prompt":"reggae"}',
      }),
      env,
    );
    expect(sent!.url).toBe("https://beatbox.grahammiles.me/api/generate-step");
    expect(sent!.headers.get("Origin")).toBe("https://beatbox.grahammiles.me");
    expect(await sent!.text()).toBe('{"prompt":"reggae"}');
    expect(r.status).toBe(503);
    expect(r.headers.get("Retry-After")).toBe("2");
    expect(await r.json()).toEqual({ error: "Jev is busy" });
  });
  it("does not expose the audio classifier and redirects the legacy route", async () => {
    const env = make();
    expect(
      (
        await worker.fetch(
          new Request("https://jevbox.grahammiles.me/api/classify"),
          env,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await worker.fetch(
          new Request("https://jevbox.grahammiles.me/make"),
          env,
        )
      ).headers.get("Location"),
    ).toBe("https://jevbox.grahammiles.me/");
  });
});
