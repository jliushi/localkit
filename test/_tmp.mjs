import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('./test/fixtures/edit-text.pdf')), standardFontDataUrl: './node_modules/pdfjs-dist/standard_fonts/' }).promise;
const p = await doc.getPage(1);
const tc = await p.getTextContent();
console.log(JSON.stringify(tc.items.map(i=>[i.str,i.transform.map(n=>+n.toFixed(1)),Math.round(i.width)])), Object.keys(tc.styles).length, JSON.stringify(tc.styles));
