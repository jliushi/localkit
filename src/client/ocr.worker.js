// Own the Tesseract worker from a terminable parent worker. Canceling this worker
// also stops its child while core/language downloads are still initializing.
import { createWorker } from 'tesseract.js';

let engine, language;
self.onmessage = async ({ data }) => {
  try {
    if (!engine || language !== data.language) {
      await engine?.terminate();
      engine = await createWorker(data.language, 1, {
        workerPath: `${data.base}/vendor/tesseract/worker.min.js`,
        corePath: `${data.base}/vendor/tesseract/core`,
        langPath: `${data.base}/vendor/tesseract/lang`,
        workerBlobURL: false,
        logger: progress => self.postMessage({ type: 'progress', ...progress }),
        errorHandler: error => self.postMessage({ type: 'error', message: error?.message || String(error) }),
      });
      language = data.language;
      await engine.setParameters({ preserve_interword_spaces: '1' });
    }
    const { data: result } = await engine.recognize(data.image, {}, { text: true, blocks: true });
    const boxes = (result.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => (p.lines || []).map(l => l.bbox)));
    self.postMessage({ type: 'result', text: result.text, boxes });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
};
