// Runs the expire-rentals cron locally on an interval, mimicking the
// "* * * * *" (every minute) schedule from vercel.json. Vercel only
// triggers crons in production, so this stands in for it during `next dev`.

import { config } from 'dotenv';
config({ path: '.env.local' });

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/api/cron/expire-rentals`;
const INTERVAL_MS = 60_000; // every minute, matches "* * * * *"

async function runCronTick() {
  try {
    const res = await fetch(URL, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[cron-dev] ${res.status}`, data);
      return;
    }
    if (data.expired_count > 0) {
      console.log(`[cron-dev] expired ${data.expired_count} rental(s):`, data.rental_ids);
    } else {
      console.log('[cron-dev] tick — nothing to expire');
    }
  } catch (err) {
    // Most common cause: next dev isn't up yet. Harmless, next tick will retry.
    console.error('[cron-dev] request failed:', err.message);
  }
}

console.log(`[cron-dev] polling ${URL} every ${INTERVAL_MS / 1000}s`);
runCronTick();
setInterval(runCronTick, INTERVAL_MS);