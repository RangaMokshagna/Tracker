// Server-only: never import server modules from src/.
export const GEMINI_MODEL = "gemini-3.8-flash";
export const SYSTEM_PROMPT =
  "You are a concise, encouraging running coach. Answer only running, training, recovery, and nutrition-for-runners questions. Max 120 words. Do not give medical diagnoses; suggest a doctor for pain or injury.";
export const DAILY_LIMIT = 10;
export const USER_RPM = 2;
export const CACHE_TTL = 86400000;
export const TIMEOUT_MS = 10000;
