import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createChatRoute, limitWords, redactQuestion } from "./chatRoute.ts";
import { CoachStore } from "./store.ts";
import { CACHE_TTL } from "./config.ts";
const context = { weeklyDistanceKm: 12, averagePaceSeconds: 360, goal: "10K" };
const request = (
  question = "How can I improve my pace?",
  token = "valid",
  ctx: unknown = context,
  stream = false,
) =>
  new Request("http://localhost/api/coach/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: stream ? "application/x-ndjson" : "application/json",
    },
    body: JSON.stringify({ question, context: ctx }),
  });
const stores: CoachStore[] = [];
afterEach(() => {
  for (const store of stores.splice(0)) store.close();
});
function setup(
  options: { enabled?: boolean; fail?: boolean; timeout?: boolean } = {},
) {
  const store = new CoachStore(":memory:");
  stores.push(store);
  let now = Date.parse("2026-10-23T12:00:00Z"),
    calls = 0;
  const sent: unknown[] = [];
  const handler = createChatRoute({
    enabled: options.enabled ?? true,
    store,
    now: () => now,
    timeoutMs: 10,
    authenticate: async (token) =>
      token === "valid"
        ? "verified-user"
        : token === "other"
          ? "other-user"
          : null,
    generate: async function* (question, ctx, signal) {
      calls++;
      sent.push({ question, context: ctx });
      if (options.timeout)
        await new Promise<void>((_, reject) =>
          signal.addEventListener("abort", () => reject(new Error("timeout")), {
            once: true,
          }),
        );
      yield "Keep your ";
      if (options.fail) throw new Error("quota or provider error");
      yield "easy runs conversational.";
    },
  });
  return {
    handler,
    store,
    sent,
    calls: () => calls,
    advance: (ms: number) => {
      now += ms;
    },
  };
}
describe("optional coach server", () => {
  it("does not contact a model when disabled, unsigned, or given a forged identity", async () => {
    const disabled = setup({ enabled: false });
    assert.equal(
      (await (await disabled.handler(request())).json()).source,
      "offline",
    );
    assert.equal(disabled.calls(), 0);
    const enabled = setup();
    assert.equal(
      (await (await enabled.handler(request("pace", "fake"))).json()).reason,
      "sign-in-required",
    );
    assert.equal(enabled.calls(), 0);
  });
  it("returns streamed snapshots and a terminal quota event", async () => {
    const s = setup();
    const response = await s.handler(
      request(undefined, undefined, undefined, true),
    );
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.equal(events[0].type, "delta");
    assert.equal(events.at(-1).type, "done");
    assert.equal(events.at(-1).remaining, 9);
    assert.equal(events.at(-1).text, "Keep your easy runs conversational.");
  });
  it("caches identical questions for 24h, scopes by user and context, and still counts turns", async () => {
    const s = setup();
    await s.handler(request());
    const cached = await (await s.handler(request())).json();
    assert.equal(cached.cached, true);
    assert.equal(cached.remaining, 8);
    assert.equal(s.calls(), 1);
    await s.handler(request(undefined, "other"));
    assert.equal(s.calls(), 2);
    s.advance(CACHE_TTL + 1);
    await s.handler(request());
    assert.equal(s.calls(), 3);
    s.advance(60000);
    await s.handler(
      request(undefined, "valid", { ...context, weeklyDistanceKm: 13 }),
    );
    assert.equal(s.calls(), 4);
  });
  it("enforces ten daily turns without a client-supplied user ID, then resets next UTC day", async () => {
    const s = setup();
    for (let i = 0; i < 10; i++) {
      const result = await (await s.handler(request())).json();
      assert.equal(result.remaining, 9 - i);
    }
    const result = await (await s.handler(request())).json();
    assert.equal(result.reason, "daily-limit");
    assert.equal(result.source, "offline");
    assert.equal(result.remaining, 0);
    assert.equal(s.calls(), 1);
    s.advance(86400000);
    assert.equal((await (await s.handler(request())).json()).remaining, 9);
  });
  it("throttles distinct requests per minute and resumes afterward", async () => {
    const s = setup();
    await s.handler(request("pace one"));
    await s.handler(request("pace two"));
    assert.equal(
      (await (await s.handler(request("pace three"))).json()).reason,
      "minute-limit",
    );
    assert.equal(s.calls(), 2);
    s.advance(60000);
    assert.equal(
      (await (await s.handler(request("pace three"))).json()).source,
      "gemini",
    );
  });
  it("enforces a project-wide provider throttle across users", async () => {
    const s = setup();
    s.store.globalRpm = 1;
    await s.handler(request());
    assert.equal(
      (await (await s.handler(request("pace other", "other"))).json()).reason,
      "minute-limit",
    );
  });
  it("replaces partial output on provider errors and times out to local guidance", async () => {
    for (const options of [{ fail: true }, { timeout: true }]) {
      const s = setup(options);
      const response = await s.handler(
        request(undefined, undefined, undefined, true),
      );
      const events = (await response.text())
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      assert.equal(events.at(-1).source, "offline");
      assert.equal(events.at(-1).text.includes("6:00/km"), true);
    }
  });
  it("keeps medical/off-topic questions local and rejects extra private context", async () => {
    const s = setup();
    assert.equal(
      (await (await s.handler(request("knee pain"))).json()).source,
      "offline",
    );
    assert.equal(
      (await (await s.handler(request("write a poem"))).json()).source,
      "offline",
    );
    assert.equal(
      (
        await s.handler(
          request("pace", "valid", {
            ...context,
            email: "private@example.com",
            location: [1, 2],
          }),
        )
      ).status,
      400,
    );
    assert.equal(s.calls(), 0);
    await s.handler(request());
    assert.deepEqual(s.sent[0], {
      question: "How can I improve my pace?",
      context,
    });
  });
  it("caps output at 120 words and removes common private details", () => {
    assert.equal(limitWords("word ".repeat(300)).split(" ").length, 120);
    const safe = redactQuestion(
      "Pace? My name is Alex. me@example.com 12.12345, 77.12345 https://gps.example/route",
    );
    assert.ok(!safe.includes("Alex"));
    assert.ok(!safe.includes("me@example"));
    assert.ok(!safe.includes("12.12345"));
    assert.ok(!safe.includes("gps.example"));
  });
  it("persists quotas and cached replies across server restarts", () => {
    const dir = mkdtempSync(join(tmpdir(), "stride-coach-")),
      file = join(dir, "db.sqlite"),
      now = Date.now();
    try {
      const first = new CoachStore(file);
      first.reserve("u", now, false);
      first.put("k", "cached", now + CACHE_TTL);
      first.close();
      const second = new CoachStore(file);
      assert.equal(second.remaining("u", now), 9);
      assert.equal(second.cached("k", now), "cached");
      second.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
