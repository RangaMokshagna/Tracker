# Free Coach

React Native / Expo SDK 58 + TypeScript, with an optional Node 24 backend. The default is **offline only**. There are no paid-model calls in the app. Natural Glass cards, sage actions, sand highlights and serif numbers reuse the existing theme.

## Included

- `src/features/coach/coachEngine.ts`: pure calorie, split/pace, recovery, weekly volume, PB, streak, consistency, plan and post-run summary functions. Inject `Profile.referenceDate` and `timeZone`; no clock, network, storage or identity is read by the engine. The 10% rule is a planning heuristic, not an injury prediction.
- `plans.json`: six bundled Beginner/Intermediate × 5K/10K/21K plans, 4–8 weeks. Each day resolves to an explicit workout or rest instruction. Choose 2/3/4 running days; extra days are easy, reduced schedules keep the long run. These are templates, not personalized prescriptions; read the starting-fitness prerequisite before choosing a longer plan.
- `CoachScreen`, `InsightCard`, `PlanSheet`: actual saved-run insights (no demo stats), today's workout slider, recovery days, check-off feedback, dismissible insights, sky progress ring, sand best-day bars, weekly list and first-run empty state. Plan choices, check-offs and dismissed insights persist by local account. Plans start on Monday of the current week; missed workouts are not automatically marked complete.
- `ChatScreen`: optional glass conversation, suggested questions, three typing dots, streamed text, quota label, local fallback label and medical-advice disclaimer. UI labels and controls support screen readers, reduced motion and 44px targets.
- `server/coach/chatRoute.ts`: `POST /api/coach/chat`, plus `GET` on the same path to read remaining turns. Uses the official `@google/genai` SDK. `GEMINI_MODEL` is the single pinned model constant in `server/coach/config.ts`.

## Run with no AI and no server

Leave `EXPO_PUBLIC_ENABLE_ASK_COACH=false` (default), then run `npm start`. Choose a training plan in Coach. Plans, summaries, check-offs, calorie estimates and insights need neither an account nor a connection. Ask Coach is hidden and a direct link shows a disabled screen. Starting a run still needs the normal phone/location permission required by the existing tracker.

## Optional Gemini setup

1. In [Google AI Studio](https://aistudio.google.com/apikey), create a key for a **free-tier project without billing enabled**. Do not upgrade billing to use this feature. Availability and quotas vary by account/region; the fallback remains available if free quota is exhausted.
2. Copy `server/.env.example` to `server/.env`. Fill `GEMINI_API_KEY`, `SUPABASE_URL` and `SUPABASE_ANON_KEY`, and set `ENABLE_ASK_COACH=true`. Keep that file private. The existing Supabase session is verified on the server before any Gemini request; guests and invalid sessions receive local answers.
3. Run `npm run coach:server` with Node 24. The endpoint listens on port 8787. Put it behind HTTPS when accessed beyond local development. Use one Node deployment and a persistent disk for its SQLite quota/cache database; do not run independent replicas with separate disks.
4. In the app environment set `EXPO_PUBLIC_ENABLE_ASK_COACH=true` and `EXPO_PUBLIC_COACH_API_URL` to the backend base URL. Restart Metro to apply client flags. On a physical phone, use your computer's LAN IP rather than `localhost`. For web, include its exact origin in `COACH_ALLOWED_ORIGINS`.

### Environment variables

| Variable | Where | Default / purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_ENABLE_ASK_COACH` | App | `false`; controls optional chat UI and network calls |
| `EXPO_PUBLIC_COACH_API_URL` | App | Empty; base URL of your backend |
| `ENABLE_ASK_COACH` | Server | `false`; independent kill switch |
| `GEMINI_API_KEY` | Server only | Empty; never use an `EXPO_PUBLIC_` prefix |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Server | Verify the existing bearer session using `/auth/v1/user` |
| `COACH_PORT` | Server | `8787` |
| `COACH_DB_PATH` | Server | `.coach-data/coach.sqlite`; persistent writable location |
| `COACH_GLOBAL_RPM` | Server | `4`, capped at 4; reduce for lower project quotas |
| `COACH_ALLOWED_ORIGINS` | Server | Comma-separated allowed web origins; localhost 8081/8082 by default |

The app never receives the Gemini key. The server does not trust a user ID supplied in the request. Gemini receives only the question plus weekly distance, average pace and an allowlisted goal. Name, email, profile, location and GPS routes are not included in this context. Common emails, coordinate pairs, links and explicit personal-detail phrases in question text are redacted; do not type private details into a free-text question. Free-tier data-use terms are defined by Google.

## Limits, caching and fallback

SQLite transactions enforce 10 remote turns per authenticated user per UTC day, 2 new model requests per user per minute, and at most 4 new model requests per project per minute. SDK retries are disabled. Successful cached replies are scoped to the user, normalized question, model and minimal context for 24 hours. A cache hit saves a provider call but still counts as a daily turn. Reserved attempts count even if the model fails; throttled attempts do not. Daily quotas and cache survive restarts.

Provider errors, timeouts, unavailable keys, server failure, network failure and exhausted quotas produce prepared local answers with **Offline coach answer**. Medical/pain and unrelated questions are handled locally. Partial streamed text is replaced by the final fallback if streaming fails. Output is capped at 120 words. Chats are kept in screen memory; the server stores hashed cache keys and generated answers, not raw questions or identity fields.

The old Supabase model proxies have been replaced by 410 stubs; the app no longer invokes them. If you deployed older versions, redeploy these stubs or retire those functions. Any former provider key is unused by this code.

## Checks

```sh
npx jest __tests__/coachEngine.test.ts --runInBand
npm run test:coach:server
npx expo lint
npx tsc --noEmit
npx expo export --platform all
```

Tests cover every insight rule, threshold edges, partial splits, time zones, plan variants, calories, genuine PB comparisons, quota/cache isolation, restart persistence, errors, streaming, timeout, privacy validation and disabled mode. No test makes a real Gemini call. Physical haptics, live GPS and frame rate still need phone testing.

References checked October 23, 2026: [Google free-tier pricing](https://ai.google.dev/gemini-api/docs/pricing), [official JavaScript SDK](https://github.com/googleapis/js-genai), [API keys](https://ai.google.dev/gemini-api/docs/api-key), [Expo 58 streaming fetch](https://docs.expo.dev/versions/v58.0.0/sdk/expo/).
