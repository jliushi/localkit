# Preserving both LocalKit histories

The release integrates the local 31-tool rewrite with remote main at `d36b87d3a15226f56ca3d4fa2e94f8a1448f4c12`. Local completion work is committed as `c26cb74eb6c6e398c4fe5c6af6f1df17d4230a23`. A complete, verified Git bundle was saved outside the repository before merging. Neither history is rebased or force-pushed.

The remote patch targets the original UI and old filenames. Those entry points have been replaced by the redesigned tools; their safety fixes are ported to the active implementation instead of shipping unused legacy scripts. Public legacy URLs continue redirecting to the corresponding new tools.

| Remote changes | Active implementation |
| --- | --- |
| GitHub Actions Chrome sandbox, PR checks, deploy only after passing tests, optional real-model checks | Both workflows retain these requirements; release checks additionally cover all 31 tools and bilingual metadata. |
| Node minimum version, isolated page-test outputs, empty-sitemap rejection | Preserved in package metadata/lock and `test/pages.mjs`. |
| File read errors, unsupported types, stable inputs during tasks, visible cancellation | `filePicker`, opt-in progress locking and `abortable` in `lib.js`; PDF/video exports lock controls while preserving cancellation. |
| Engine loading cancellation, worker reset, output validation and failed-file cleanup | Remote ffmpeg lifecycle retained, plus local legacy metadata probing and validated ffprobe JSON compatibility. |
| Base64 standard Data URIs, stale file type clearing | Ported to the live two-pane Base64 tool, with malformed input and preview URL regression coverage. |
| PDF stale-document clearing, visible load errors, whitespace ranges, checkbox state, editor shortcuts | Ported to split, PDF-to-image, editor, shared PDF helpers and progress controls. Added recovery tests and stopped delayed text checks from reading replaced documents. |
| Image type verification, partial failures, cancellation, duplicate ZIP names, image URL cleanup | Ported to the shared batch/image helpers. Failed items remain visible; successful outputs remain downloadable; stale results are not included in ZIPs. |
| Media cancellation, output MIME, audio fallback, preview cleanup, valid trimming | Ported to current conversion, trim and audio tools. Current audio conversion selects AAC encoding when stream copy cannot be used. The timeline clamps ranges and rejects malformed edits. |
| Resume import/storage validation, local-only photos, quota warning, final save | Original v1 validator retained in `resume-legacy.js`; v2 schema/photo checks added without dropping 12 templates, modules, drafts or JSON migration. Invalid imports preserve the current draft. |
| Whisper cancellation, bounded/sorted segments and model disposal | Ported to the current transcription/export flow; aborts decoding, model connection and worker waits, and keeps cancellation separate from failures. |
| Honest device/memory limits in homepage copy | Retained alongside the redesigned tool catalog in both languages. |

Regression checks are adapted to the new UI rather than retaining obsolete selectors. The release runner exercises static assets, 68 pages at two widths, malformed/replaced files, real exported media and PDFs, resume draft safety, plus optionally real external AI models. Production acceptance is recorded separately in the supervisor report after deployment.

## Release-gate follow-ups

The Linux gate caught a font-dependent overflow in the subtitle guide table. Guide tables now have keyboard-focusable local scrolling, with a 320/390-pixel regression instead of hiding overflow on the page.

Forced garbage collection reproduced an audio-sample cleanup race during automatic format/range changes. Audio extraction now uses the existing, locally hosted ffmpeg worker for deterministic termination and serialized restarts. AAC-to-M4A still copies the original packets; MP3/WAV range exports are checked by ffprobe, and AAC packet hashes must match the input. Other tools retain their existing media implementation and dependency versions; a trial dependency upgrade did not resolve the issue and was not retained.

Shared native-media cancellation also waits for its original cleanup promise before disposing the input. A deterministic regression checks this ordering. `LK_TRACE_SAMPLES=brief` enables leaked-sample metadata during browser tests; `LK_TRACE_SAMPLES=1` additionally records allocation stacks. These diagnostics never run in the published application.
