import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const run = async (args) => {
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit', env: process.env });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`${args.join(' ')} exited ${code}`);
};

let server;
try {
  await run(['test/make-release-fixtures.mjs']);
  await run(['build/build.mjs']);
  await run(['test/site.mjs']);
  if (!process.env.BASE_URL) {
    server = spawn(process.execPath, ['build/serve.mjs', process.env.TEST_PORT || '0'], { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
    const [data] = await Promise.race([
      once(server.stdout, 'data'),
      once(server, 'exit').then(([code]) => { throw new Error(`Preview server exited ${code}`); }),
      once(server, 'error').then(([error]) => { throw error; }),
    ]);
    process.env.BASE_URL = data.toString().trim().replace(/\/$/, '');
  }
  await run(['test/regressions.mjs']);
  await run(['test/pages.mjs']);
  const args = process.argv.slice(2).filter((arg) => arg !== '--ai');
  if (!process.argv.includes('--ai')) args.push('--skip-ai');
  await run(['test/e2e.mjs', ...args]);
  if (process.argv.includes('--ai')) await run(['test/translate-subtitles-e2e.mjs']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server?.pid && server.exitCode === null) {
    const stopped = once(server, 'exit');
    server.kill();
    await stopped;
  }
}
