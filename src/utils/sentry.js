import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('[sentry] initialized');
  } catch (e) {
    console.warn('[sentry] initialization failed', e.message || e);
  }
}

export function captureException(err, ctx = {}) {
  try {
    Sentry.captureException(err, { extra: ctx });
  } catch (e) {
    console.warn('[sentry] capture failed', e.message || e);
  }
}
