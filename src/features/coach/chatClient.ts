import { fetch } from "expo/fetch";
import { supabase } from "../../services/supabase";
import { COACH_API_URL, ENABLE_ASK_COACH } from "./config";
import { offlineAnswer } from "./offlineCoach";
import type { ChatReply, CoachContext } from "./types";

async function token() {
  try {
    return (await supabase.auth.getSession()).data.session?.access_token;
  } catch {
    return undefined;
  }
}
export async function getMessagesLeft(
  signal?: AbortSignal,
): Promise<number | null> {
  if (!ENABLE_ASK_COACH || !COACH_API_URL) return null;
  const access = await token();
  if (!access) return null;
  try {
    const result = await fetch(
      `${COACH_API_URL.replace(/\/$/, "")}/api/coach/chat`,
      { headers: { Authorization: `Bearer ${access}` }, signal },
    );
    if (!result.ok) return null;
    const body = await result.json();
    return typeof body.remaining === "number" ? body.remaining : null;
  } catch {
    return null;
  }
}
export async function sendCoachQuestion(
  question: string,
  context: CoachContext,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<ChatReply> {
  const offline = (): ChatReply => ({
    text: offlineAnswer(question, context),
    source: "offline",
    remaining: null,
  });
  if (!ENABLE_ASK_COACH || !COACH_API_URL) return offline();
  const access = await token();
  if (!access) return offline();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(
      `${COACH_API_URL.replace(/\/$/, "")}/api/coach/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({
          question,
          context: {
            weeklyDistanceKm: context.weeklyDistanceKm,
            averagePaceSeconds: context.averagePaceSeconds,
            goal: context.goal,
          },
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) return offline();
    if (!response.headers.get("content-type")?.includes("application/x-ndjson"))
      return (await response.json()) as ChatReply;
    const reader = response.body?.getReader();
    if (!reader) return offline();
    const decoder = new TextDecoder();
    let pending = "",
      final: ChatReply | undefined;
    const parse = (line: string) => {
      if (!line.trim()) return;
      const data = JSON.parse(line) as ChatReply & { type: string };
      if (data.type === "delta") onText(data.text);
      if (data.type === "done") final = data;
    };
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        let newline;
        while ((newline = pending.indexOf("\n")) >= 0) {
          parse(pending.slice(0, newline));
          pending = pending.slice(newline + 1);
        }
      }
      pending += decoder.decode();
      if (pending.trim()) parse(pending);
    } finally {
      reader.releaseLock();
    }
    return final || offline();
  } catch {
    return offline();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
