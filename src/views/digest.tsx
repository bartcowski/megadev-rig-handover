import type { Night } from '../digest/types.js';

const dash = '—';

export function Digest({ night, data }: { night: string; data: Night }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {data.badLines > 0 && <p class="mute">{data.badLines} unreadable line{data.badLines === 1 ? '' : 's'} skipped</p>}
      {data.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last</th><th>last error</th><th>first</th><th>last at</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr>
                <td>{r.job}</td>
                <td>{r.owner ?? dash}</td>
                <td>{r.runs}</td>
                <td class={r.retries >= 3 ? 'warn' : ''}>{r.retries}{r.retries >= 3 ? ' ▲' : ''}</td>
                <td class={r.lastStatus === 'fail' ? 'warn' : ''}>{r.lastStatus}{r.lastStatus === 'fail' ? ' ✗' : ''}</td>
                <td>{r.lastError ?? dash}</td>
                <td>{r.firstAt}</td>
                <td>{r.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p><a href="/">← status</a></p>
    </>
  );
}
