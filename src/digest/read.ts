import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunStatus } from './types.js';

const STATUSES = new Set<string>(['ok', 'retry', 'fail']);

function parseLine(line: string) {
  try {
    const o = JSON.parse(line);
    if (
      o && typeof o === 'object' &&
      typeof o.at === 'string' && typeof o.job === 'string' && STATUSES.has(o.status) &&
      (o.owner === null || typeof o.owner === 'string') &&
      (o.error === undefined || typeof o.error === 'string')
    ) {
      return o as { at: string; job: string; status: RunStatus; owner: string | null; error?: string };
    }
  } catch {
    // counted by the caller
  }
  return null;
}

export const readNight: ReadNight = (runsDir, night) => {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }
  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const e = parseLine(line);
    if (!e) {
      badLines++;
      continue;
    }
    const row = rows.get(e.job);
    if (!row) {
      rows.set(e.job, {
        job: e.job,
        owner: e.owner,
        runs: 1,
        retries: e.status === 'retry' ? 1 : 0,
        lastStatus: e.status,
        lastError: e.error ?? null,
        firstAt: e.at,
        lastAt: e.at,
      });
      continue;
    }
    row.runs++;
    if (e.status === 'retry') row.retries++;
    row.owner = e.owner;
    row.lastStatus = e.status;
    row.lastError = e.error ?? null;
    row.lastAt = e.at;
  }
  const result: Night = { rows: [...rows.values()].sort((a, b) => a.job.localeCompare(b.job)), badLines };
  return result;
};
