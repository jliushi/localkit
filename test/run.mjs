// Self-contained local/CI suite. AI model downloads are an explicit, separate check.
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
  await run(['build/build.mjs']);
  if (!process.env.BASE_URL) {
    const port = process.env.TEST_PORT || '8090';
    process.env.BASE_URL = `http://localhost:${port}/localkit`;
    server = spawn(process.execPath, ['build/serve.mjs', port], { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
    await Promise.race([
      once(server.stdout, 'data'),
      once(server, 'exit').then(([code]) => { throw new Error(`Preview server exited ${code}`); }),
    ]);
  }
  await run(['test/pages.mjs']);
  const only = process.argv.includes('--ai') ? ['--only=ai-subtitles']
    : ['--only=base64,text-diff,image-converter,pdf-merge,pdf-split,pdf-organize,pdf-to-images,scan-to-pdf,pdf-edit,video-converter,video-trim,extract-audio,resume-builder'];
  await run(['test/e2e.mjs', ...only]);
  await run(['test/regressions.mjs']);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  server?.kill();
}
