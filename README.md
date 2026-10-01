# LocalKit 本地工具箱

Free online tools that run entirely in the browser, in English and 中文. Files are never uploaded.

**Live:** https://jliushi.github.io/localkit/ ([English](https://jliushi.github.io/localkit/en/) · [中文](https://jliushi.github.io/localkit/zh/))

| Tool | How it works |
|---|---|
| AI subtitle generator | Whisper speech recognition via transformers.js (WebGPU or WebAssembly). Exports SRT/VTT/TXT; can burn subtitles into an MP4 with ffmpeg.wasm. |
| Merge / split / organize PDF, PDF to images | pdf-lib for writing, pdf.js for rendering |
| PDF editor | Adds text, signatures, images and white-out. Text is rasterised, so any language works without embedding fonts. |
| Scan to PDF / images to PDF | Canvas filters: auto-levels, grayscale, and adaptive-threshold black & white |
| Image converter | Canvas encoding to JPG/PNG/WebP/AVIF/ICO; HEIC input via heic2any |
| Video converter, trimmer, audio extractor | ffmpeg.wasm (single-threaded core) |
| Resume builder | Live A4 preview; the PDF is made with the browser's print dialog; drafts are saved in localStorage |
| Text diff, Base64 | jsdiff; native APIs |

No servers, accounts, cookies or analytics. Whisper model files are downloaded from Hugging Face, or from hf-mirror.com when Hugging Face is unreachable, and cached by the browser.

## Development

```sh
npm install
node build/build.mjs              # writes dist/ (bundles with esbuild, copies wasm into dist/vendor)
node build/serve.mjs 8090         # http://localhost:8090/localkit/
node test/make-fixtures.mjs       # test images and PDFs (videos are made with ffmpeg; see test/fixtures)
node test/e2e.mjs [--only=pdf-merge] [--shots]   # drives every tool in headless Chrome
node test/pages.mjs               # every page, both languages, phone and desktop width
node scripts/make-images.mjs      # icon-180.png, og-en.png, og-zh.png
```

To add a tool, create `src/tools/<id>.mjs` (strings and UI markup for both languages) and `src/client/<id>.js` (browser code), then add the id to `TOOL_ORDER` in `build/build.mjs`.

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## License

MIT
