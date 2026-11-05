export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type Night = {
  rows: DigestRow[];
  badLines: number;
};

// Reads runs/<night>.jsonl. Returns null when the night has no file.
// A line that doesn't parse is counted in badLines, never thrown.
// The implementation, `readNight`, lives in src/digest/read.ts and has this type.
export type ReadNight = (runsDir: string, night: string) => Night | null;
