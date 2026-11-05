import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const night = readNight('runs', '2026-10-28')!;
    expect(night.rows).toHaveLength(5);
    expect(night.badLines).toBe(1);
    const sync = night.rows.find((r) => r.job === 'lane/sync')!;
    expect(sync.owner).toBe('rook');
    const fixtures = night.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(fixtures.retries).toBe(3);
    expect(fixtures.lastStatus).toBe('ok');
    const backup = night.rows.find((r) => r.job === 'notes/backup')!;
    expect(backup.lastStatus).toBe('fail');
    expect(backup.lastError).toBe('quota exceeded');
  });

  it('keeps rows with a null owner', () => {
    const row = readNight('runs', '2026-10-28')!.rows.find((r) => r.job === 'digest/render')!;
    expect(row.owner).toBeNull();
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });
});
