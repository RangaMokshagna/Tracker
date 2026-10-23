// Deprecated paid proxy. Redeploy this stub to retire an older deployment.
Deno.serve(() => Response.json({ error: 'Retired. Use the local coach or the optional /api/coach/chat server.' }, { status: 410 }));
