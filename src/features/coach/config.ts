/** Core coaching never depends on this switch, a network connection, or a key. */
export const ENABLE_ASK_COACH =
  process.env.EXPO_PUBLIC_ENABLE_ASK_COACH === "true";
export const COACH_API_URL = process.env.EXPO_PUBLIC_COACH_API_URL || "";
