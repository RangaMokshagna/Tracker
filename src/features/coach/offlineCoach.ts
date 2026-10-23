import type { CoachContext } from "./types";
import { pace } from "./format.ts";
const round = (n: number) => Math.round(n * 10) / 10;

export function offlineAnswer(question: string, context: CoachContext): string {
  const q = question.toLowerCase();
  if (/pain|injur|hurt|shin|knee|chest|dizz/.test(q))
    return "Pause running if you have pain or feel unwell. A doctor or qualified clinician can help assess pain or injury. I cannot diagnose a condition or tell you it is safe to run through symptoms.";
  if (/rest|recover|run today|tired/.test(q))
    return `You have logged ${round(context.weeklyDistanceKm)} km this week. If you feel unusually tired, choose rest or a gentle walk. If you feel well and recovered, keep the next run easy. Rest is part of training.`;
  if (/pace|speed|faster/.test(q))
    return `Your recent average pace is ${context.averagePaceSeconds ? `${pace(context.averagePaceSeconds)}/km` : "not available yet"}. Build consistency with comfortable, conversational runs. Start gently and finish feeling in control before adding harder sessions.`;
  if (/calori|fuel|food|nutri|eat|water|hydrat/.test(q))
    return `At ${round(context.weeklyDistanceKm)} km this week, energy needs depend on your body, effort and conditions. The calorie estimator uses pace, weight and time; it is approximate. Eat regular balanced meals, use familiar fluids and snacks for longer runs, and avoid treating estimated calories as a strict food target.`;
  if (/plan|10k|5k|half|21k|goal/.test(q))
    return `Your goal is ${context.goal}. Open Choose a plan for the bundled 5K, 10K or 21K schedule. Pick a level whose starting distance already feels comfortable. Use the scheduled rest days and repeat a week whenever recovery needs more time.`;
  return "I can help with running, training, recovery and nutrition for runners. Try asking about pace, rest, calories or a 10K plan. For medical concerns, speak with a doctor.";
}
