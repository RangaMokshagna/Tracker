// Post-run summaries now run locally, without a model or API key.
Deno.serve(() => Response.json({ error: 'Retired. Post-run summaries are generated offline in the app.' }, { status: 410 }));
