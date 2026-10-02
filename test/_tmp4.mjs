import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
const d = await PDFDocument.load(fs.readFileSync('test/fixtures/form.pdf'));
const f = d.getForm();
f.getTextField('fullName').setText('Ada');
f.getRadioGroup('plan').select('pro');
try { f.flatten(); } catch (e) { console.log('ERR', e.message); }
console.log(d.getForm().getFields().length);
