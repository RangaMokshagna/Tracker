/**
 * STRIDE — Supabase Edge Function: Smart Weekly Plan Generator
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { targetWeeklyKm = 25, unit = 'km', restDays = ['Tuesday', 'Thursday'] } = await req.json();

    const plan = {
      week: new Date().toISOString(),
      targetDistance: targetWeeklyKm,
      schedule: [
        { day: 'Monday', workoutType: 'Easy Aerobic', distance: Math.round(targetWeeklyKm * 0.2), note: 'Zone 2 conversational pace' },
        { day: 'Tuesday', workoutType: 'Rest & Mobility', distance: 0, note: 'Foam roll and hip flexor stretches' },
        { day: 'Wednesday', workoutType: 'Tempo Intervals', distance: Math.round(targetWeeklyKm * 0.25), note: '10 min warmup + 4x 1km at 10k pace' },
        { day: 'Thursday', workoutType: 'Active Recovery', distance: Math.round(targetWeeklyKm * 0.15), note: 'Very gentle shakeout run' },
        { day: 'Friday', workoutType: 'Rest', distance: 0, note: 'Hydrate and prep for weekend long run' },
        { day: 'Saturday', workoutType: 'Long Run', distance: Math.round(targetWeeklyKm * 0.4), note: 'Slow, steady cardiovascular foundation' },
        { day: 'Sunday', workoutType: 'Rest / Stretch', distance: 0, note: 'Full bodily recovery' },
      ],
    };

    return new Response(JSON.stringify({ plan }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
