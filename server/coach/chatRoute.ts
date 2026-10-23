import { createHash } from "node:crypto";
import { offlineAnswer } from "../../src/features/coach/offlineCoach.ts";
import type {
  ChatReply,
  CoachContext,
} from "../../src/features/coach/types.ts";
import { CACHE_TTL, GEMINI_MODEL, TIMEOUT_MS } from "./config.ts";
import type { CoachStore } from "./store.ts";
export type Generator = (
  question: string,
  context: CoachContext,
  signal: AbortSignal,
) => AsyncIterable<string>;
interface Dependencies {
  enabled: boolean;
  store: CoachStore;
  authenticate: (token: string) => Promise<string | null>;
  generate?: Generator;
  now?: () => number;
  timeoutMs?: number;
}
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export function limitWords(text: string) {
  return text.trim().split(/\s+/).slice(0, 120).join(" ");
}
export function redactQuestion(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/https?:\/\/\S+/gi, "[link removed]")
    .replace(
      /-?\d{1,3}\.\d{3,}\s*[,;]\s*-?\d{1,3}\.\d{3,}/g,
      "[coordinates removed]",
    )
    .replace(
      /\b(my name is|i am called|i live in|my address is|my location is)\s+[^.!?\n]+/gi,
      "[personal detail removed]",
    );
}
function parse(
  body: unknown,
): { question: string; context: CoachContext } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    Object.keys(b).some((key) => !["question", "context"].includes(key)) ||
    typeof b.question !== "string" ||
    !b.question.trim() ||
    b.question.length > 1000 ||
    !b.context ||
    typeof b.context !== "object"
  )
    return null;
  const c = b.context as Record<string, unknown>;
  if (
    Object.keys(c).some(
      (key) =>
        !["weeklyDistanceKm", "averagePaceSeconds", "goal"].includes(key),
    )
  )
    return null;
  if (
    typeof c.weeklyDistanceKm !== "number" ||
    !Number.isFinite(c.weeklyDistanceKm) ||
    c.weeklyDistanceKm < 0 ||
    c.weeklyDistanceKm > 1000
  )
    return null;
  if (
    c.averagePaceSeconds !== null &&
    (typeof c.averagePaceSeconds !== "number" ||
      !Number.isFinite(c.averagePaceSeconds) ||
      c.averagePaceSeconds < 60 ||
      c.averagePaceSeconds > 3600)
  )
    return null;
  if (!["5K", "10K", "21K", "Build consistency"].includes(String(c.goal)))
    return null;
  return {
    question: redactQuestion(b.question.trim()),
    context: {
      weeklyDistanceKm: c.weeklyDistanceKm,
      averagePaceSeconds: c.averagePaceSeconds as number | null,
      goal: String(c.goal),
    },
  };
}
export function createChatRoute(deps: Dependencies) {
  return async function route(request: Request): Promise<Response> {
    if (!["GET", "POST"].includes(request.method))
      return json({ error: "Method not allowed" }, 405);
    const now = deps.now?.() ?? Date.now();
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/i)?.[1];
    let user: string | null = null;
    if (deps.enabled && token) {
      try {
        user = await deps.authenticate(token);
      } catch {
        /* local answer below */
      }
    }
    const identity = user
      ? createHash("sha256").update(user).digest("hex")
      : null;
    const remaining = identity ? deps.store.remaining(identity, now) : null;
    if (request.method === "GET")
      return json({
        remaining,
        enabled: deps.enabled,
        onlineAvailable: !!identity && !!deps.generate,
      });
    let input;
    try {
      const raw = await request.text();
      if (raw.length > 8192) return json({ error: "Request too large" }, 413);
      input = parse(JSON.parse(raw));
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (!input)
      return json(
        { error: "Expected a question and minimal training context" },
        400,
      );
    const { question, context } = input;
    const fallback = (reason: string, left = remaining): ChatReply => ({
      text: offlineAnswer(question, context),
      source: "offline",
      remaining: left,
      reason,
    });
    if (!deps.enabled || !deps.generate || !identity)
      return json(
        fallback(
          !deps.enabled
            ? "disabled"
            : !identity
              ? "sign-in-required"
              : "not-configured",
        ),
      );
    if (
      /pain|injur|hurt|shin|knee|chest|dizz/i.test(question) ||
      !/run|pace|speed|train|recover|rest|calori|fuel|food|nutri|eat|water|hydrat|plan|10k|5k|21k|half|goal|tired/i.test(
        question,
      )
    )
      return json(fallback("local-guidance"));
    const cacheKey = createHash("sha256")
      .update(
        JSON.stringify([
          identity,
          GEMINI_MODEL,
          question.toLowerCase().replace(/\s+/g, " "),
          context,
        ]),
      )
      .digest("hex");
    const cached = deps.store.cached(cacheKey, now),
      quota = deps.store.reserve(identity, now, !!cached);
    if (!quota.allowed) return json(fallback(quota.reason!, quota.remaining));
    if (cached)
      return json({
        text: cached,
        source: "gemini",
        remaining: quota.remaining,
        cached: true,
      } satisfies ChatReply);
    const wantsStream = request.headers
      .get("accept")
      ?.includes("application/x-ndjson");
    const abort = new AbortController();
    const onAbort = () => abort.abort();
    request.signal.addEventListener("abort", onAbort, { once: true });
    const generate = async (
      emit: (data: unknown) => void,
    ): Promise<ChatReply> => {
      const timer = setTimeout(
        () => abort.abort(),
        deps.timeoutMs ?? TIMEOUT_MS,
      );
      let output = "";
      try {
        for await (const chunk of deps.generate!(
          question,
          context,
          abort.signal,
        )) {
          if (abort.signal.aborted) throw new Error("Cancelled");
          output += chunk;
          if (wantsStream) emit({ type: "delta", text: limitWords(output) });
          if (output.trim().split(/\s+/).length >= 120) break;
        }
        const text = limitWords(output);
        if (!text || abort.signal.aborted)
          throw new Error("Empty or timed-out response");
        deps.store.put(cacheKey, text, now + CACHE_TTL);
        return { text, source: "gemini", remaining: quota.remaining };
      } catch {
        return fallback("unavailable", quota.remaining);
      } finally {
        clearTimeout(timer);
        abort.abort();
        request.signal.removeEventListener("abort", onAbort);
      }
    };
    if (!wantsStream) return json(await generate(() => {}));
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (data: unknown) => {
          if (!request.signal.aborted)
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };
        try {
          const result = await generate(emit);
          emit({ type: "done", ...result });
          controller.close();
        } catch {
          try {
            controller.close();
          } catch {
            /* cancelled */
          }
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  };
}
