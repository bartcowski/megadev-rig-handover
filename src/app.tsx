import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Digest } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard, type NightCounts } from './views/status.js';

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) => {
    const status = readStatus(config);
    const counts: NightCounts = {};
    for (const n of status.nights) {
      const night = readNight(config.runsDir, n);
      if (!night) continue;
      counts[n] = { ok: 0, retry: 0, fail: 0 };
      for (const r of night.rows) counts[n][r.lastStatus]++;
    }
    return c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={status} counts={counts} />
      </Layout>,
    );
  });

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    const data = NIGHT.test(night) ? readNight(config.runsDir, night) : null;
    if (!data) return c.text('no such night', 404);
    return c.html(
      <Layout title={`digest ${night}`} lane={lane()}>
        <Digest night={night} data={data} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    const data = NIGHT.test(night) ? readNight(config.runsDir, night) : null;
    if (!data) return c.json({ error: 'no such night' }, 404);
    return c.json({ night, badLines: data.badLines, rows: data.rows });
  });

  return app;
}
