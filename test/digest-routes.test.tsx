import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
writeFileSync(join(dir, '2026-01-01.jsonl'), '');
writeFileSync(
  join(dir, '2026-01-02.jsonl'),
  [
    '{"at":"2026-01-02T01:00:00+01:00","job":"b/job","status":"fail","owner":null,"error":"boom"}',
    'not json',
    '{"at":"2026-01-02T02:00:00+01:00","job":"a/job","status":"ok","owner":"rook"}',
  ].join('\n') + '\n',
);
const app = createApp({ adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir: dir });

describe('digest routes', () => {
  it('page renders 200 with rows sorted by job', async () => {
    const res = await app.request('/digest/2026-01-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeGreaterThan(-1);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('—');
    expect(html).toContain('1 unreadable line');
  });

  it('JSON has the same jobs in the same order as the page', async () => {
    const html = await (await app.request('/digest/2026-01-02')).text();
    const body = (await (await app.request('/api/digest/2026-01-02')).json()) as { rows: { job: string }[]; badLines: number };
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(html.indexOf(body.rows[0].job)).toBeLessThan(html.indexOf(body.rows[1].job));
  });

  it('404 for a night with no file', async () => {
    expect((await app.request('/digest/2000-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/2000-01-01')).status).toBe(404);
  });

  it('empty night says nothing ran', async () => {
    const res = await app.request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
    const json = (await (await app.request('/api/digest/2026-01-01')).json()) as { rows: unknown[] };
    expect(json.rows).toEqual([]);
  });

  it('board links each night with counts', async () => {
    const html = await (await app.request('/')).text();
    expect(html).toContain('href="/digest/2026-01-02"');
    expect(html).toContain('ok 1 · retry 0 · fail 1');
  });
});
