/**
 * STRIDE — Supabase Edge Function: Post-Run 3-Line Insight
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
    const { distanceMeters, durationSeconds, avgPaceSecondsPerKm, bestPaceSecondsPerKm, profile } = await req.json();

    const km = (distanceMeters / 1000).toFixed(2);
    const paceMin = Math.floor(avgPaceSecondsPerKm / 60);
    const paceSec = Math.round(avgPaceSecondsPerKm % 60).toString().padStart(2, '0');

    if (!ANTHROPIC_API_KEY) {
      // Return structured fallback
      return new Response(
        JSON.stringify({
          insight: {
            paceTrend: `Steady pacing maintained across ${km} km at ${paceMin}:${paceSec}/km.`,
            effortAssessment: 'Aerobic zone 2 conditioning stimulus achieved.',
            improvementTip: 'Prioritize protein intake and rehydration within 45 minutes.',
            fullText: `Steady pacing across ${km} km.\nAerobic zone 2 stimulus achieved.\nPrioritize protein and rehydration.`,
          },
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const prompt = `Analyze this completed run:
Distance: ${km} km
Duration: ${Math.round(durationSeconds / 60)} minutes
Average Pace: ${paceMin}:${paceSec} /km
Best Split Pace: ${bestPaceSecondsPerKm ? Math.floor(bestPaceSecondsPerKm / 60) + ':' + Math.round(bestPaceSecondsPerKm % 60) : 'N/A'} /km

Output EXACTLY three bullet points (and nothing else):
Line 1 (Pace Trend): 1 sentence evaluating pacing consistency or acceleration.
Line 2 (Effort Assessment): 1 sentence on aerobic vs anaerobic physiological benefit.
Line 3 (Improvement Tip): 1 actionable recovery or biomechanical tip for next session.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);

    const paceTrend = lines[0]?.replace(/^[0-9\.\-\*\•\s]+/, '') || `Consistent ${km} km effort.`;
    const effortAssessment = lines[1]?.replace(/^[0-9\.\-\*\•\s]+/, '') || 'Solid aerobic base maintenance.';
    const improvementTip = lines[2]?.replace(/^[0-9\.\-\*\•\s]+/, '') || 'Hydrate well and stretch hamstrings.';

    return new Response(
      JSON.stringify({
        insight: {
          paceTrend,
          effortAssessment,
          improvementTip,
          fullText: `${paceTrend}\n${effortAssessment}\n${improvementTip}`,
        },
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
