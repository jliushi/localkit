// Deterministic tiny fixtures. The bundled speech is synthesized with Windows SAPI.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.join(root, 'test/fixtures', name);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=8', '-f', 'lavfi', '-i', "aevalsrc='if(lt(mod(t,4),2),0.25*sin(2*PI*440*t),0)':s=48000:d=8", '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', fixture('cleanup-silence.mp4')]);
ff(['-i', fixture('cleanup-silence.mp4'), '-vn', '-c:a', 'pcm_s16le', fixture('cleanup-silence.wav')]);
ff(['-display_rotation', '90', '-i', fixture('cleanup-silence.mp4'), '-c', 'copy', fixture('cleanup-rotated.mp4')]);
ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=12', '-i', fixture('cleanup-voice.wav'), '-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.055:sample_rate=48000:duration=12:seed=42', '-filter_complex', '[1:a]aresample=48000,adelay=2000,apad[voice];[voice][2:a]amix=inputs=2:duration=shortest:normalize=0[a]', '-map', '0:v', '-map', '[a]', '-t', '12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', fixture('cleanup-noisy.mp4')]);
ff(['-i', fixture('cleanup-noisy.mp4'), '-vn', '-c:a', 'pcm_s16le', fixture('cleanup-noisy.wav')]);
ff(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '2', fixture('cleanup-all-silent.wav')]);
// The public samples use a calm waveform visual; diagnostic test patterns stay in fixtures.
const font = process.platform === 'win32' ? "fontfile='C\\:/Windows/Fonts/arial.ttf'" : 'font=DejaVuSans';
for (const [source, dest, duration, title, subtitle] of [
  ['cleanup-silence.mp4', 'silence-demo.mp4', 8, 'A little room to speak', 'Two tones. Two pauses. Try a shorter cut.'],
  ['cleanup-noisy.mp4', 'noisy-voice-demo.mp4', 12, 'Voice with background noise', 'A synthetic recording with steady white noise.'],
]) {
  ff(['-f', 'lavfi', '-i', `color=c=0x101826:s=640x360:r=30:d=${duration}`, '-i', fixture(source),
    '-filter_complex', `[1:a]showwaves=s=560x92:mode=cline:rate=30:colors=0xa78bfa:scale=sqrt[wave];[0:v][wave]overlay=40:184:shortest=1,drawtext=${font}:text='LocalKit':fontsize=18:fontcolor=0xc4b5fd:x=40:y=34,drawtext=${font}:text='${title}':fontsize=30:fontcolor=white:x=40:y=94,drawtext=${font}:text='${subtitle}':fontsize=18:fontcolor=0xaab6ca:x=40:y=142,drawtext=${font}:text='Private. Local. Yours.':fontsize=14:fontcolor=0x7f8da3:x=40:y=310[v]`,
    '-map', '[v]', '-map', '1:a:0', '-t', String(duration), '-c:v', 'libx264', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', path.join(root, 'src/assets/samples', dest)]);
}
console.log('Audio cleanup fixtures and public samples ready.');
