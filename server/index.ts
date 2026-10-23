import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { createChatRoute } from "./coach/chatRoute.ts";
import { CoachStore } from "./coach/store.ts";
import { GEMINI_MODEL, SYSTEM_PROMPT, TIMEOUT_MS } from "./coach/config.ts";

const enabled = process.env.ENABLE_ASK_COACH === "true";
const key = process.env.GEMINI_API_KEY;
const path = process.env.COACH_DB_PATH || ".coach-data/coach.sqlite";
mkdirSync(dirname(path), { recursive: true });
const store = new CoachStore(path, Number(process.env.COACH_GLOBAL_RPM) || 4);
const ai =
  enabled && key
    ? new GoogleGenAI({
        apiKey: key,
        httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: 1 } },
      })
    : null;
const route = createChatRoute({
  enabled,
  store,
  authenticate: async (token) => {
    const url = process.env.SUPABASE_URL,
      anon = process.env.SUPABASE_ANON_KEY;
    if (!url || !anon || token.length > 4096) return null;
    const result = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
      signal: AbortSignal.timeout(3000),
    });
    if (!result.ok) return null;
    const user = (await result.json()) as { id?: string };
    return user.id || null;
  },
  generate: ai
    ? async function* (question, context, signal) {
        const stream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [
                { text: JSON.stringify({ question, training: context }) },
              ],
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 512,
            temperature: 0.5,
            abortSignal: signal,
          },
        });
        for await (const chunk of stream) if (chunk.text) yield chunk.text;
      }
    : undefined,
});
const origins = (
  process.env.COACH_ALLOWED_ORIGINS ||
  "http://localhost:8082,http://localhost:8081"
).split(",");
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !origins.includes(origin)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Accept",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url !== "/api/coach/chat") {
    res.writeHead(404);
    res.end();
    return;
  }
  const abort = new AbortController();
  res.on("close", () => abort.abort());
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 8192) {
        res.writeHead(413);
        res.end();
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request("http://coach.local/api/coach/chat", {
      method: req.method,
      headers: {
        authorization: req.headers.authorization || "",
        accept: req.headers.accept || "",
      },
      body:
        req.method === "POST"
          ? Buffer.concat(chunks).toString("utf8")
          : undefined,
      signal: abort.signal,
    });
    const response = await route(request);
    res.writeHead(
      response.status,
      Object.fromEntries(response.headers.entries()),
    );
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (!abort.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    res.end();
  } catch {
    if (!res.headersSent)
      res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Coach temporarily unavailable. Use the offline coach.",
      }),
    );
  }
});
server.requestTimeout = 15000;
server.listen(Number(process.env.COACH_PORT) || 8787, () =>
  console.log(
    "Coach server listening; optional chat:",
    enabled ? "enabled" : "disabled",
  ),
);
for (const event of ["SIGINT", "SIGTERM"] as const)
  process.on(event, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );
