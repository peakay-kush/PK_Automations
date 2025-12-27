// Lazy-load Sentry to avoid module initialization issues on Vercel
let Sentry = null;
let sentryInitialized = false;

async function loadSentry() {
  if (Sentry) return Sentry;
  try {
    Sentry = await import('@sentry/nextjs');
    return Sentry;
  } catch (e) {
    console.warn('[sentry] Failed to load @sentry/nextjs:', e.message);
    return null;
  }
}

export async function initSentry() {
  if (sentryInitialized) return;
  sentryInitialized = true;
  
  if (!process.env.SENTRY_DSN) return;
  try {
    const sentryModule = await loadSentry();
    if (!sentryModule) return;
    
    sentryModule.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('[sentry] initialized');
  } catch (e) {
    console.warn('[sentry] initialization failed', e.message || e);
  }
}

export async function captureException(err, ctx = {}) {
  try {
    const sentryModule = await loadSentry();
    if (!sentryModule) return;
    sentryModule.captureException(err, { extra: ctx });
  } catch (e) {
    console.warn('[sentry] capture failed', e.message || e);
  }
}
