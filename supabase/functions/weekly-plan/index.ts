// Plans are bundled as JSON and work without a server.
Deno.serve(() => Response.json({ error: 'Retired. Use the bundled offline training plans.' }, { status: 410 }));
