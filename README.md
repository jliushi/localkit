# LocalKit 本地工具箱

Free online tools that run entirely in the browser, in English and 中文. Files are never uploaded.

**Live:** https://jliushi.github.io/localkit/ ([English](https://jliushi.github.io/localkit/en/) · [中文](https://jliushi.github.io/localkit/zh/))

| Tool | How it works |
|---|---|
| AI subtitle generator / subtitle translation | Whisper recognition and local translation via transformers.js. Export SRT/VTT/TXT, or burn subtitles into MP4. Model files download on first use. |
| Merge / split / organize PDF, PDF to images | pdf-lib for writing, pdf.js for rendering |
| PDF editor | Edit existing text one line at a time, add selectable text and annotations, fill forms, sign, and arrange pages. Fonts are substituted; unsupported originals may be covered rather than removed. This is not a secure redaction tool. |
| Scan to PDF / images to PDF | Canvas filters: auto-levels, grayscale, and adaptive-threshold black & white |
| Image converter | Canvas encoding to JPG/PNG/WebP/AVIF/ICO; HEIC input via heic2any |
| Video converter, trimmer, merger, audio extractor | Mediabunny/WebCodecs, with ffmpeg.wasm for legacy containers. Output support depends on the browser codecs. |
| Rotate / crop / speed / soundtrack | Interactive orientation and crop previews; pitch-preserving speed changes; mute, replace or mix music locally. |
| Remove silence / voice noise reduction | Inspect detected pauses before cutting; RNNoise WebAssembly for voice denoising, with before/after comparison. |
| Background removal / image OCR | Local cutouts with transparent or coloured backgrounds; Tesseract text recognition with editable results, clipboard input and batch export. |
| Resume builder | 12 templates, editable modules, style controls, multiple local drafts, one-page fit, PDF/PNG/JPG/JSON export. Selectable-text PDF uses the browser print dialog; direct image PDF is rasterised. |
| Text diff, Base64 | jsdiff; native APIs |

No application server, accounts, cookies or analytics. User files stay on the device. Some AI model files download from Hugging Face or hf-mirror.com and are cached by the browser; OCR language data and denoising assets are served by the site. Performance and maximum practical file size depend on browser support and available memory. See each tool's page for its limits.

## Development

```sh
npm ci
node build/build.mjs              # writes dist/ (bundles with esbuild, copies wasm into dist/vendor)
node build/serve.mjs 8090         # http://localhost:8090/localkit/
node test/make-fixtures.mjs       # test images and PDFs (videos are made with ffmpeg; see test/fixtures)
npm test -- --only=merge-pdf --shots   # drives real tools in headless Chrome; server must be running
npm test                         # full output checks, including model downloads (ffmpeg/ffprobe required)
npm run test:site                # sitemap, bilingual links, metadata, JSON-LD and local/share assets
npm run test:pages               # every page, both languages, phone and desktop width
node scripts/make-images.mjs      # icon-180.png, og-en.png, og-zh.png
```

To add a tool, create `src/tools/<id>.mjs` (strings and UI markup for both languages) and `src/client/<id>.js` (browser code), then add the id to `TOOL_ORDER` in `build/build.mjs`.

Set `BASE_URL` to test another preview port or the deployed site. Git Bash users should set `MSYS_NO_PATHCONV=1` when passing URL paths. Generated screenshots and downloads are in `test/out/` and are not committed.

Pushing to `main` installs the locked dependencies, builds, audits the static output, then deploys to GitHub Pages (`.github/workflows/deploy.yml`). The final step notifies IndexNow; submission does not guarantee indexing or traffic. Generate share images when adding or renaming tools so the static audit passes.

## License

MIT
