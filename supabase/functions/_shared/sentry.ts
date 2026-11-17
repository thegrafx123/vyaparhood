// Error reporting for edge functions. Does nothing until the SENTRY_DSN
// secret is set:  supabase secrets set SENTRY_DSN=https://...
// Reports thrown errors and any 5xx response, tagged with the function name.
import * as Sentry from 'npm:@sentry/deno@10';

const dsn = Deno.env.get('SENTRY_DSN');

if (dsn) {
  Sentry.init({
    dsn,
    environment: Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production',
    // Edge functions serve many requests per isolate; the default
    // integrations share scope between them, so keep them off.
    defaultIntegrations: false,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  Sentry.setTag('region', Deno.env.get('SB_REGION') ?? 'unknown');
  Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID') ?? 'unknown');
}

type Handler = (req: Request) => Response | Promise<Response>;

export function withSentry(name: string, handler: Handler): Handler {
  return async (req) => {
    try {
      const res = await handler(req);
      if (dsn && res.status >= 500) {
        const body = await res.clone().text().catch(() => '');
        Sentry.captureMessage(`${name} returned ${res.status}`, {
          level: 'error',
          tags: { function: name },
          extra: { body: body.slice(0, 500) },
        });
        await Sentry.flush(5000);
      }
      return res;
    } catch (e) {
      console.error(`[${name}]`, e);
      if (dsn) {
        const id = Sentry.captureException(e, { tags: { function: name } });
        const sent = await Sentry.flush(5000);
        console.log(`[sentry] event ${id} ${sent ? 'sent' : 'NOT sent (flush timed out)'}`);
      } else {
        console.log('[sentry] SENTRY_DSN not set, error not reported');
      }
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
