import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const make = (name, args) => {
  const target = path.join(fixtures, name);
  if (fs.existsSync(target)) return;
  execFileSync('ffmpeg', ['-v', 'error', ...args, target], { stdio: 'inherit' });
  console.log(`Generated ${name}`);
};

make('phone-1080p.mp4', ['-f', 'lavfi', '-i', 'testsrc2=s=1920x1080:rate=30,noise=alls=12:allf=t', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '8M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k']);
make('bigphoto.jpg', ['-f', 'lavfi', '-i', 'testsrc2=s=3000x4000,noise=alls=25:allf=t', '-frames:v', '1', '-q:v', '2']);
make('tone-5s.mp4', ['-f', 'lavfi', '-i', 'testsrc2=s=640x360:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k']);
make('music-440hz-5s.wav', ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '5', '-c:a', 'pcm_s16le']);
make('music-880hz-1s.wav', ['-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000', '-t', '1', '-c:a', 'pcm_s16le']);

if (!fs.existsSync(path.join(fixtures, 'heavy.pdf'))) {
  const document = await PDFDocument.create();
  const photo = await document.embedJpg(fs.readFileSync(path.join(fixtures, 'bigphoto.jpg')));
  const image = await document.embedPng(fs.readFileSync(path.join(fixtures, 'bigshot.png')));
  for (const asset of [photo, photo, image]) {
    document.addPage([595, 842]).drawImage(asset, { x: 0, y: 0, width: 595, height: 842 });
  }
  fs.writeFileSync(path.join(fixtures, 'heavy.pdf'), await document.save());
  console.log('Generated heavy.pdf');
}
