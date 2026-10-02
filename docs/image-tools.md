# Image tools delivery and verification

## Background removal

`remove-background` uses transformers.js 4.3 in a terminable Web Worker. It tries
WebGPU when an adapter exists and falls back to WASM after a GPU initialization
or inference failure. CPU can also be selected explicitly. Files are decoded
locally and reduced to a maximum 4096-pixel long edge. Model output supplies the
actual alpha matte; there is no colour-erasing substitute or test-only output.

| Mode | Model and licence | Weight size | Source |
| --- | --- | ---: | --- |
| Any subject | U²-Net small, Apache-2.0 | 4,574,861 bytes | Same-origin `assets/models/u2netp`; [upstream](https://github.com/xuebinqin/U-2-Net), [licence](https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE), [ONNX/checksum](https://github.com/danielgatis/rembg/blob/main/rembg/sessions/u2netp.py) |
| Portrait | Xenova/MODNet, Apache-2.0 | CPU uint8: 6,627,048 bytes; WebGPU fp32: 25,888,640 bytes | [model card](https://huggingface.co/Xenova/modnet), [ONNX sizes](https://huggingface.co/api/models/Xenova/modnet/tree/main/onnx), [upstream licence](https://github.com/ZHKKKe/MODNet/blob/master/LICENSE) |

The shared ONNX runtime additionally loads approximately 26.9 MB of WASM and
53 KB of its loader on first use. Model-size labels are explicitly model sizes,
not the entire first-visit transfer. Caching depends on the browser and storage
availability. U²-Net small is bundled unchanged, including its licence and
checksum record. MODNet downloads from Hugging Face, trying hf-mirror.com if the
primary host cannot be reached. Only public model/config files are requested;
photos are never uploaded. Mirror reachability cannot be guaranteed in every
network. U²-Net does not need these external hosts.

BiRefNet lite was evaluated and rejected for this delivery: its exported input
is fixed at 1024 × 1024, the fp32 WASM inference exhausted browser memory, and
512-pixel input was rejected by the ONNX graph. U²-Net small has a real general
subject model and fits browser memory. It is less precise on small details.
MODNet is explicitly for people, not a claimed general object replacement.

The tool supports batches, slider/toggle comparison, checkerboard transparency,
white/blue/red/custom backgrounds, PNG or flattened JPG, per-image download,
ZIP, cancellation and retry. Cancel terminates model loading/inference workers.

## OCR

`image-to-text` uses `tesseract.js` 7.0.0 and `tesseract.js-core` 7.0.0
(Apache-2.0), plus version 1.0.0 of the six `@tesseract.js-data/*` packages.
The package wrappers declare MIT; their traineddata comes from
[naptha/tessdata](https://github.com/naptha/tessdata), whose
[Apache-2.0 licence](https://github.com/naptha/tessdata/blob/gh-pages/LICENSE)
is retained at `assets/models/tessdata-LICENSE`. Package metadata is copied
alongside each language file for provenance. Core and worker licences ship in
`vendor/tesseract/`.

| Selected language data | Gzipped bytes |
| --- | ---: |
| English (`eng`) | 2,952,873 |
| Simplified Chinese (`chi_sim`) | 1,718,768 |
| Traditional Chinese (`chi_tra`) | 1,656,239 |
| French (`fra`) | 707,406 |
| German (`deu`) | 1,333,102 |
| Spanish (`spa`) | 2,100,190 |

Chinese modes also load English. The Tesseract worker is 111,307 bytes. Only one
of the embedded LSTM core loaders is requested for the browser's feature set:
3,896,484 bytes (plain), 3,899,472 (SIMD), or 3,905,767 (relaxed SIMD), before HTTP
compression. Unused legacy cores and duplicate `.wasm` files are not shipped.
The language files, worker and cores are all served from this site's origin.
No Google, jsDelivr or model CDN is required by OCR; access to the site itself
is still necessary. English starts in English, Chinese in simplified+English.
Each language version's sample matches its default language.

The UI supports pasted screenshots, multiple files, progress/cancel, editable
per-image results, detected line rectangles, copy, individual TXT and combined
text. A parent worker owns Tesseract's nested worker, so cancel also stops
startup/language downloads. A failed cold offline load is reported and leaves
retry available. With the engine loaded, a later image works offline in the
same session. This is not a promise that the whole site can be reopened offline.

Printed, upright, high-contrast text works best. Handwriting, tables, multi-column
layout and very small text need review. Chinese traineddata contains eight
obsolete configuration keys; Tesseract emits harmless “Parameter not found”
warnings. Tests allow only that exact upstream warning list and still fail on
all actual browser/runtime errors.

## Reproducible checks

Run the site on port 8092, then in PowerShell:

```powershell
$env:BASE_URL = 'http://localhost:8092/localkit'
rtk npm run build
rtk proxy node test/e2e.mjs --only=remove-background,image-to-text --shots
rtk proxy node test/image-tools-visual.mjs
rtk proxy node test/image-tools-offline.mjs
```

Six E2E scenarios passed using actual models and downloaded files:

1. U²-Net on CPU: transparent background/opaque subject pixels in downloaded PNG.
2. MODNet: actual blue-background JPG pixels and retained astronaut foreground.
3. Generated bottle plus portrait: alpha checks, cancellation/retry, ZIP contents,
   390-pixel layout.
4. Known English text: recognition, line boxes, editable TXT and real clipboard copy;
   all OCR requests stay on the page's origin.
5. Known simplified Chinese: clipboard paste adds one file, batch and combined TXT.
6. Known traditional Chinese: cancellation, retry and expected recognized text.

WebGPU additionally completed real U²-Net inference with a non-fallback adapter.
CPU and GPU results were visually checked; timings are device-dependent.
Eight screenshots (both tools × en/zh × 1280/390) are in
`test/out/image-tools/`; each was opened and reviewed. All viewport widths passed
the horizontal-overflow check. The offline check covers initial load failure,
successful retry, and reuse of loaded engines without a network connection.

`test/make-ocr-fixtures.mjs` renders the known-text and bottle fixtures locally.
`portrait.jpg` is the NASA Neil Armstrong official portrait, S69-31741
([NASA image record](https://images.nasa.gov/details/S69-31741)); it is used only
as a processing sample, without implying NASA endorsement.

## Shared changes

`build/build.mjs` vendors the OCR assets; package manifests lock the new
dependencies. The shared stylesheet adds the two tool layouts and repairs a
pre-existing missing closing brace after the PDF mobile rules. E2E scenarios
extend `test/e2e.mjs`. The tool order already contained both IDs. No deployment
or push is part of this branch. The main branch owns the final four OG images
and whole-site release checks.
