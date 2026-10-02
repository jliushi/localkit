// Deterministic tiny fixtures. The bundled speech is synthesized with Windows SAPI.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.join(root, 'test/fixtures', name);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=8', '-f', 'lavfi', '-i', "aevalsrc='if(lt(mod(t,4),2),0.25*sin(2*PI*440*t),0)':s=48000:d=8", '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', fixture('cleanup-silence.mp4')]);
ff(['-i', fixture('cleanup-silence.mp4'), '-vn', '-c:a', 'pcm_s16le', fixture('cleanup-silence.wav')]);
ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=12', '-i', fixture('cleanup-voice.wav'), '-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.055:sample_rate=48000:duration=12:seed=42', '-filter_complex', '[1:a]aresample=48000,adelay=2000,apad[voice];[voice][2:a]amix=inputs=2:duration=shortest:normalize=0[a]', '-map', '0:v', '-map', '[a]', '-t', '12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', fixture('cleanup-noisy.mp4')]);
ff(['-i', fixture('cleanup-noisy.mp4'), '-vn', '-c:a', 'pcm_s16le', fixture('cleanup-noisy.wav')]);
ff(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '2', fixture('cleanup-all-silent.wav')]);
for (const [source, dest] of [['cleanup-silence.mp4', 'silence-demo.mp4'], ['cleanup-noisy.mp4', 'noisy-voice-demo.mp4']]) fs.copyFileSync(fixture(source), path.join(root, 'src/assets/samples', dest));
console.log('Audio cleanup fixtures and public samples ready.');
