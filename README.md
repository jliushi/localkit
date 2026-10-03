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
npm ci                          # Node >=22.13 (CI uses Node 22); ffmpeg/ffprobe needed for output verification
node build/build.mjs              # writes dist/ (bundles with esbuild, copies wasm into dist/vendor)
node build/serve.mjs 8090         # http://localhost:8090/localkit/
node test/make-fixtures.mjs       # test images and PDFs (videos are made with ffmpeg; see test/fixtures)
npm test                         # builds, starts preview, checks 32 pages + file outputs + failure/retry regressions
npm run test:ai                   # real EN/ZH Whisper recognition + subtitle burn-in; downloads model files
node test/e2e.mjs --only=pdf-merge # against an already running preview
node scripts/make-images.mjs      # icon-180.png, og-en.png, og-zh.png
```

To add a tool, create `src/tools/<id>.mjs` (strings and UI markup for both languages) and `src/client/<id>.js` (browser code), then add the id to `TOOL_ORDER` in `build/build.mjs`.

Set `PUPPETEER_EXECUTABLE_PATH` to an installed Chrome/Edge executable if Puppeteer has no downloaded browser. `TEST_PORT` changes the preview port; `BASE_URL` uses an existing preview. Downloads and screenshots go to a temporary directory (`TEST_OUT` can override it).

Pushing to `main` deploys to GitHub Pages **after the normal test suite passes** (`.github/workflows/deploy.yml`). Pull requests run the same checks without deployment. The separate **AI subtitle acceptance** workflow can be run manually for the network-dependent recognition checks.

## Processing and recovery

- File loading and processing keep inputs/settings stable until completion. AI recognition and media conversion have a Cancel button; cancellation stops the worker, and retry creates a fresh engine.
- Invalid PDFs clear the previous document's controls. Image batches retain successful outputs and identify failures; duplicate filenames are preserved in ZIPs.
- Resume imports validate field types and accept only embedded raster photos. Invalid imports preserve the current draft. A blocked/full browser storage reports a warning to export the draft.
- File size and processing time depend on available device memory. AI model downloads require connectivity on first use; CPU/GPU speed and recognition quality vary. PDF white-out is a visual overlay, not secure redaction (see the tool FAQ).

浏览器验收包括：中英文页面和手机/桌面宽度、真实 PDF 页数与旋转、图片/音视频文件格式、取消后重试、损坏文件替换、批量部分失败、简历导入及草稿恢复。AI 验收实际识别中英文样例并检查压制后的视频和音轨。

## License

MIT
