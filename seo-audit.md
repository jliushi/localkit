# LocalKit SEO / GEO 审核报告

分支：`helper/kimi` · 2026-10-01 · 对象：20 个工具页 × 中英双语 + 首页/共通文案 + 构建脚本（JSON-LD、hreflang、sitemap、llms.txt、robots.txt）

## 1. 发现的主要问题与处理原则

（按出现频率排序）

1. **EN 标题超长**：20 个英文 title 中 19 个超过 65 字符（最长 convert-image 83 字符），桌面 SERP 必然截断，卖点 "No Upload" 掉进省略号。已全部重写为 ≤64 字符，核心搜索词（compress video / pdf merge / heic to jpg…）前置。
2. **ZH 标题结构问题**：8 个中文 title 超过约 32 汉字可见极限；普遍「在线视频压缩」式把修饰词「在线」放在核心关键词前面。已改为「视频压缩 — 在线…」式，核心词前置以匹配中文用户真实检索（百度工具类结果的主流写法）。
3. **EN 描述超长**：全部 20 个 description 165–231 字符。已压缩到 162–190 区间（个别工具保留略长约 10–20 字符，因为把 "no upload, no watermark" 双卖点放在尾部，Google 即使截断也常直接引用前半句）：核心词与方法在前，差异点在中段。
4. **GEO——首段不可直接引用**：多数页 `sub` 以祈使句开头（"Drop a video…"/"拖入视频…"），AI 引擎提取"一句话答案"拿不到完整定义。EN 19 页、ZH 19 页已改为自包含的答案式定义句："X is a free online tool that does A by doing B, without C" ／「X 是一个免费的在线工具：…，全程不上传」。
5. **steps 与实际交互顺序不符（事实问题）**：convert-image / heic-to-jpg / jpg-to-pdf / compress-image / compare-text / scan-to-pdf 把"拖入后自动开始"写成了手动步骤；base64 的两个步骤混排编码/解码；resume-builder 还在引用旧的「打印 → 另存为 PDF」流程（现在直接下载）。这类"介绍与行为不一致"既伤信任也产生错误的 HowTo 摘要，全部已修正。
6. **keywords 同义词不足**：补齐用户真实拼写变体，只进入站内搜索的 `data-search`（不构成页面关键词堆砌）。
7. **llms.txt 构造不当**：每工具塞 ~170 字符整段 description、缺少"在什么提问下应引用本站"线索（见 §4）。
8. **JSON-LD 小缺口**：WebApplication 缺 `dateModified`；HowTo 缺 `description`（见 §5）。

**你没有说出来的事实问题**，本次没有发现：没有虚构数据、没有"全球最快/百万用户"类宣传；中文基本是地道表达，主要问题在结构而非翻译腔。各平台大小限制表格（Gmail 25MB / Discord 10MB / WhatsApp 16MB）保留了原有的「以页面公布为准、失败就再选小一点」的稳妥表述。

## 2. 逐页 title / description 修改前后对照

EN 目标：title ≤65 字符、desc ≈120–165 字符；ZH 目标：title ≲32 汉字、desc ≈70–110 汉字。括号为字符数。

### 首页（src/common-strings.mjs）

| 字段 | 修改前 | 修改后 |
|---|---|---|
| EN title (78→63) | LocalKit — Free Online Video, PDF & Image Tools That Never Upload Your Files | LocalKit — Free Video, PDF & Image Tools, No Upload, No Sign-up |
| ZH title | LocalKit 本地工具箱 — 免费在线视频、PDF、图片工具，文件不上传 | LocalKit 本地工具箱 — 免费视频、PDF、图片在线工具，文件不上传 |
| EN desc (226→217) | Compress and trim videos, convert to MP3 or GIF, generate AI subtitles, merge and edit PDFs, convert HEIC and compress images — free, no sign-up, no watermark. Files are processed in your browser and never uploaded. | Free online tools to compress video, convert MP4 to MP3/GIF, generate AI subtitles, merge and edit PDF, convert HEIC to JPG and compress images — all in your browser. No upload, no sign-up, no watermark. |
| ZH desc | 在线压缩和剪辑视频、视频转 MP3 和 GIF、AI 生成字幕、合并编辑 PDF、HEIC 转 JPG、压缩图片 —— 免费、免注册、无水印。文件在浏览器本地处理，绝不上传。 | 免费在线工具：视频压缩、视频转 MP3/GIF、AI 字幕、PDF 合并编辑、PDF 压缩、HEIC 转 JPG、图片压缩转格式等 20 个。文件只在浏览器本地处理，免注册、无水印、不限大小。 |
| EN/ZH homeLead | 仅一句话口号 | 扩成可被直接引用的"站点用途定义句"（GEO），含 20 个工具、全部浏览器本地运行 |

## 3. 20 个工具页修改前后对照

### compress-video

**EN title** 77 → 59

| Before | After |
|---|---|
| Compress Video Online Free — Reduce MP4/MOV Size to 10 MB, 25 MB… (No Upload) | Compress Video Online Free — MP4/MOV to 10/25 MB, No Upload |

**EN description** 202 → 176

| Before | After |
|---|---|
| Free online video compressor: pick a target size like 10 MB or 25 MB and get the best quality that fits. Works with MP4, MOV, MKV, WebM. Fast hardware encoding in your browser — no upload, no watermark. | Free video compressor: target a size like 10 MB or 25 MB, keep the best quality that fits. MP4, MOV, MKV, WebM — fast hardware encoding in the browser. No upload, no watermark. |

**ZH title** 39 → 37

| Before | After |
|---|---|
| 在线视频压缩 — 免费把 MP4/MOV 压缩到 10MB、25MB（不上传） | 视频压缩 — 在线压缩 MP4/MOV 到 10MB、25MB，免费不上传 |

**ZH description** 83 → 84

| Before | After |
|---|---|
| 免费在线视频压缩：选择目标大小（如 10MB、25MB），自动得到能放下的最好画质。支持 MP4、MOV、MKV、WebM。在浏览器里用硬件加速压缩，不上传、无水印。 | 免费在线视频压缩：选择目标大小（如 10MB、25MB），自动得到能放下的最好画质。支持 MP4、MOV、MKV、WebM。硬件加速，在浏览器本地压缩，不上传、无水印。 |

### trim-video

**EN title** 71 → 63

| Before | After |
|---|---|
| Trim Video Online Free — Cut MP4, MOV & WebM Clips Instantly, No Upload | Trim Video Online Free — Cut MP4/MOV Clips Without Quality Loss |

**EN description** 184 → 164

| Before | After |
|---|---|
| Cut a video to the part you need: drag the handles on the filmstrip, preview, and save in seconds without re-encoding or quality loss. MP4, MOV, MKV, WebM. Free, private, no watermark. | Free video trimmer: drag the handles, preview and save the clip you need in seconds — no re-encoding, no quality loss. MP4, MOV, MKV, WebM. No upload, no watermark. |

**ZH title** 37 → 31

| Before | After |
|---|---|
| 在线视频剪切 — 免费截取 MP4、MOV、WebM 片段，秒出结果不上传 | 视频剪切 — 在线截取 MP4/MOV 片段，无损秒出，不上传 |

**ZH description** 74 → 74

| Before | After |
|---|---|
| 把视频剪成需要的片段：在缩略图时间轴上拖动手柄、预览，几秒钟保存，不重新编码、画质无损。支持 MP4、MOV、MKV、WebM。免费、私密、无水印。 | 把视频剪成需要的片段：在缩略图时间轴上拖动手柄、预览，几秒钟保存，不重新编码、画质无损。支持 MP4、MOV、MKV、WebM，免费、私密、无水印。 |

### video-to-mp3

**EN title** 67 → 57

| Before | After |
|---|---|
| Video to MP3 Converter — Extract Audio from MP4/MOV Free, No Upload | Video to MP3 — Extract Audio from MP4/MOV Free, No Upload |

**EN description** 195 → 169

| Before | After |
|---|---|
| Convert MP4, MOV, MKV or WebM to MP3, M4A or WAV in seconds. Drop a video and the audio is extracted instantly in your browser — choose quality, keep only part of it. Free, private, no watermark. | Convert video to MP3 in seconds: drop an MP4, MOV, MKV or WebM and get the audio as MP3, M4A or WAV with quality choice. Runs in your browser — free, private, no upload. |

**ZH title** 32 → 32

| Before | After |
|---|---|
| 视频转 MP3 — 在线从 MP4/MOV 提取音频，免费不上传 | 视频转 MP3 — 在线从 MP4/MOV 提取音频，免费不上传 |

**ZH description** 79 → 79

| Before | After |
|---|---|
| 几秒钟把 MP4、MOV、MKV、WebM 转成 MP3、M4A 或 WAV。拖入视频即可在浏览器里立刻提取音频，可选音质、可只保留一段。免费、私密、无水印。 | 几秒钟把 MP4、MOV、MKV、WebM 转成 MP3、M4A 或 WAV。拖入视频即可在浏览器里立刻提取音频，可选音质、可只保留一段。免费、私密、无水印。 |

### convert-video

**EN title** 68 → 64

| Before | After |
|---|---|
| Video Converter Online Free — MOV, MKV, WebM, AVI to MP4 (No Upload) | Video Converter Online Free — MOV/MKV/AVI/WebM to MP4, No Upload |

**EN description** 177 → 165

| Before | After |
|---|---|
| Convert videos between MP4, MOV, WebM and MKV — MOV to MP4, MKV to MP4, WebM to MP4, AVI to MP4 and more. Often instant without re-encoding. Free, private, runs in your browser. | Convert videos between MP4, MOV, WebM and MKV — MOV to MP4, MKV to MP4, WebM to MP4, AVI to MP4. Instant without re-encoding when possible. Free, private, no upload. |

**ZH title** 39 → 37

| Before | After |
|---|---|
| 在线视频格式转换 — MOV、MKV、WebM、AVI 转 MP4，免费不上传 | 视频格式转换 — MOV/MKV/AVI/WebM 转 MP4，免费不上传 |

**ZH description** 101 → 79

| Before | After |
|---|---|
| 在 MP4、MOV、WebM、MKV 之间转换视频 —— MOV 转 MP4、MKV 转 MP4、WebM 转 MP4、AVI 转 MP4 等。很多情况下无需重新编码，秒转。免费、私密，在浏览器中运行。 | 视频格式在线转换：MOV、MKV、WebM、AVI 转 MP4，或 MP4 转其他格式。能兼容时无需重新编码，秒速完成。免费、私密，在浏览器本地运行，不上传。 |

### video-to-gif

**EN title** 72 → 58

| Before | After |
|---|---|
| Video to GIF Converter — Make Animated GIFs from MP4/MOV Free, No Upload | Video to GIF Converter — Make GIFs from MP4/MOV, No Upload |

**EN description** 190 → 173

| Before | After |
|---|---|
| Make an animated GIF from any video: pick the moment on the filmstrip, choose size, frame rate and speed, and download. MP4, MOV, WebM to GIF in your browser — free, no watermark, no upload. | Turn a video clip into an animated GIF: pick the moment, set size, frame rate and speed, and download. MP4, MOV, WebM to GIF in your browser — free, no watermark, no upload. |

**ZH title** 32 → 32

| Before | After |
|---|---|
| 视频转 GIF — 在线把 MP4/MOV 做成动图，免费不上传 | 视频转 GIF — 在线把 MP4/MOV 做成动图，免费不上传 |

**ZH description** 85 → 85

| Before | After |
|---|---|
| 把任意视频做成 GIF 动图：在缩略图时间轴上选好片段，设置尺寸、帧率和速度，直接下载。MP4、MOV、WebM 转 GIF 在浏览器中完成 —— 免费、无水印、不上传。 | 把任意视频做成 GIF 动图：在缩略图时间轴上选好片段，设置尺寸、帧率和速度，直接下载。MP4、MOV、WebM 转 GIF 在浏览器中完成 —— 免费、无水印、不上传。 |

### ai-subtitle-generator

**EN title** 79 → 63

| Before | After |
|---|---|
| AI Subtitle Generator — Auto Subtitles for Video, Free SRT Download (No Upload) | AI Subtitle Generator — Auto Subtitles, SRT Download, No Upload |

**EN description** 231 → 173

| Before | After |
|---|---|
| Automatically generate subtitles for any video or audio with Whisper AI, in 99 languages. Edit the text and timing, download SRT/VTT, or burn subtitles into the video. Runs privately in your browser — free, no upload, no watermark. | Auto-generate subtitles with Whisper AI in 99 languages. Edit text and timing, download SRT/VTT or burn subtitles into the video. Free, private, in your browser — no upload. |

**ZH title** 31 → 29

| Before | After |
|---|---|
| AI 字幕生成 — 视频自动加字幕，免费下载 SRT（不上传） | AI 字幕生成 — 视频自动生成字幕，免费 SRT，不上传 |

**ZH description** 99 → 92

| Before | After |
|---|---|
| 用 Whisper AI 为任意视频或音频自动生成字幕，支持中文、英文等 99 种语言。可修改文字和时间轴，下载 SRT/VTT，或把字幕压制进视频。在浏览器里私密运行 —— 免费、不上传、无水印。 | 用 Whisper AI 为视频或音频自动生成字幕，支持中文、英文等 99 种语言。可编辑文字和时间轴，下载 SRT/VTT，或压制进视频。浏览器本地运行 —— 免费、不上传、无水印。 |

### merge-pdf

**EN title** 64 → 56

| Before | After |
|---|---|
| Merge PDF Online Free — Combine PDF Files in Seconds (No Upload) | Merge PDF Online Free — Combine PDFs into One, No Upload |

**EN description** 178 → 162

| Before | After |
|---|---|
| Combine multiple PDF files into one: drag to reorder, see the first page of each file, and download the merged PDF. Free, no sign-up, no watermark — PDFs never leave your device. | Combine multiple PDF files into one: drag to reorder, preview each file's first page, and download. Free, no sign-up, no watermark — PDFs never leave your device. |

**ZH title** 31 → 31

| Before | After |
|---|---|
| PDF 合并 — 在线免费把多个 PDF 合并成一个（不上传） | PDF 合并 — 在线免费把多个 PDF 合并成一个（不上传） |

**ZH description** 71 → 71

| Before | After |
|---|---|
| 把多个 PDF 合并成一个：可拖动排序，能看到每个文件的第一页，直接下载合并后的 PDF。免费、免注册、无水印 —— PDF 不离开你的设备。 | 把多个 PDF 合并成一个：可拖动排序，能看到每个文件的第一页，直接下载合并后的 PDF。免费、免注册、无水印 —— PDF 不离开你的设备。 |

### split-pdf

**EN title** 67 → 60

| Before | After |
|---|---|
| Split PDF Online Free — Extract Pages or Split by Range (No Upload) | Split PDF Online — Extract or Separate Pages Free, No Upload |

**EN description** 172 → 176

| Before | After |
|---|---|
| Split a PDF visually: click the pages to extract, split every page into its own file, cut every N pages, or type ranges like 1-3, 8-10. Free, private, runs in your browser. | Split a PDF visually: click pages to extract them into a new PDF, split every page into its own file, cut every N pages or type ranges like 1-3, 8-10. Free, private, no upload. |

**ZH title** 28 → 28

| Before | After |
|---|---|
| PDF 拆分 — 在线免费提取页面或按范围拆分（不上传） | PDF 拆分 — 在线免费提取页面或按范围拆分（不上传） |

**ZH description** 72 → 72

| Before | After |
|---|---|
| 可视化拆分 PDF：点选要提取的页面，或每页拆成一个文件、每 N 页拆一份、按「1-3, 8-10」这样的范围拆分。免费、私密，在浏览器中完成。 | 可视化拆分 PDF：点选要提取的页面，或每页拆成一个文件、每 N 页拆一份、按「1-3, 8-10」这样的范围拆分。免费、私密，在浏览器中完成。 |

### organize-pdf

**EN title** 58 → 61

| Before | After |
|---|---|
| Rotate PDF, Delete & Reorder Pages Online Free (No Upload) | Rotate PDF & Delete or Reorder Pages — Free Online, No Upload |

**EN description** 194 → 164

| Before | After |
|---|---|
| Rotate PDF pages, delete pages and drag them into a new order — with page thumbnails. Select several pages for bulk actions, add pages from another PDF, and save. Free, private, in your browser. | Rotate PDF pages, delete pages and drag them into a new order with page thumbnails. Bulk-select pages, append another PDF, and save. Free, private, in your browser. |

**ZH title** 28 → 28

| Before | After |
|---|---|
| PDF 旋转、删除页面、调整顺序 — 在线免费（不上传） | PDF 旋转、删除页面、调整顺序 — 在线免费（不上传） |

**ZH description** 76 → 76

| Before | After |
|---|---|
| 旋转 PDF 页面、删除页面、拖动调整页面顺序 —— 带页面缩略图。可多选批量操作，可追加另一个 PDF 的页面，然后保存。免费、私密，在浏览器中完成。 | 旋转 PDF 页面、删除页面、拖动调整页面顺序 —— 带页面缩略图。可多选批量操作，可追加另一个 PDF 的页面，然后保存。免费、私密，在浏览器中完成。 |

### edit-pdf

**EN title** 71 → 53

| Before | After |
|---|---|
| Edit PDF Online Free — Add Text & Signature, Fill PDF Forms (No Upload) | Edit PDF Online — Add Text & Sign PDF Free, No Upload |

**EN description** 211 → 171

| Before | After |
|---|---|
| Fill in and sign PDFs online: type text in any language, draw, type or upload your signature, add checkmarks and images, and white-out content. Free, no sign-up, no watermark — the PDF never leaves your browser. | Fill in and sign PDFs online: type text, upload or draw your signature, add checkmarks and images, white-out content. Free, no sign-up — the PDF never leaves your browser. |

**ZH title** 35 → 29

| Before | After |
|---|---|
| 在线编辑 PDF — 免费添加文字和签名、填写 PDF 表格（不上传） | PDF 在线编辑 — 免费签名、添加文字、填表格（不上传） |

**ZH description** 76 → 74

| Before | After |
|---|---|
| 在线填写并签署 PDF：输入任意语言的文字，手写、输入或上传签名，添加勾选和图片，用涂白遮盖内容。免费、免注册、无水印 —— PDF 不离开你的浏览器。 | 在线填写并签署 PDF：输入任意语言的文字，手写、输入或上传签名，添加勾选和图片，用涂白遮盖内容。免费、免注册、无水印 —— PDF 不离开浏览器。 |

### compress-pdf

**EN title** 76 → 53

| Before | After |
|---|---|
| Compress PDF Online Free — Reduce PDF File Size, Keep Text Sharp (No Upload) | Compress PDF Online — Reduce PDF Size Free, No Upload |

**EN description** 198 → 183

| Before | After |
|---|---|
| Reduce PDF file size by recompressing the photos and scans inside it, while text stays sharp and selectable. Three compression levels, before/after sizes. Free, private, in your browser — no upload. | Reduce PDF file size by recompressing the photos and scans inside, while text stays sharp and selectable. Three compression levels, clear before/after sizes. Free, private, no upload. |

**ZH title** 36 → 32

| Before | After |
|---|---|
| PDF 压缩 — 在线免费减小 PDF 文件大小，文字依然清晰（不上传） | PDF 压缩 — 在线减小 PDF 文件大小，文字清晰（不上传） |

**ZH description** 70 → 70

| Before | After |
|---|---|
| 通过重新压缩 PDF 中的照片和扫描图来减小文件大小，文字保持清晰可选。三种压缩强度，显示压缩前后大小。免费、私密，在浏览器中完成，不上传。 | 通过重新压缩 PDF 中的照片和扫描图来减小文件大小，文字保持清晰可选。三种压缩强度，显示压缩前后大小。免费、私密，在浏览器中完成，不上传。 |

### pdf-to-jpg

**EN title** 71 → 55

| Before | After |
|---|---|
| PDF to JPG Converter — Convert PDF Pages to JPG or PNG Free (No Upload) | PDF to JPG Converter — Pages to JPG/PNG Free, No Upload |

**EN description** 183 → 174

| Before | After |
|---|---|
| Convert PDF pages to JPG or PNG images in high resolution (up to 300 DPI). Pick the pages, preview them and download one image or a ZIP. Free, private — the PDF stays in your browser. | Convert PDF pages to JPG or PNG images in high resolution (up to 300 DPI). Pick pages, preview and download one image or a ZIP. Free, private — the PDF stays in your browser. |

**ZH title** 44 → 36

| Before | After |
|---|---|
| PDF 转 JPG — 在线把 PDF 页面转换成 JPG 或 PNG 图片，免费不上传 | PDF 转 JPG — 在线把 PDF 转高清 JPG/PNG（不上传） |

**ZH description** 85 → 85

| Before | After |
|---|---|
| 把 PDF 页面转换成高分辨率（最高 300 DPI）的 JPG 或 PNG 图片。可选择页面、预览，下载单张图片或 ZIP。免费、私密 —— PDF 留在你的浏览器里。 | 把 PDF 页面转换成高分辨率（最高 300 DPI）的 JPG 或 PNG 图片。可选择页面、预览，下载单张图片或 ZIP。免费、私密 —— PDF 留在你的浏览器里。 |

### jpg-to-pdf

**EN title** 67 → 50

| Before | After |
|---|---|
| JPG to PDF Converter — Combine Images into One PDF Free (No Upload) | JPG to PDF — Convert Images to PDF Free, No Upload |

**EN description** 193 → 173

| Before | After |
|---|---|
| Convert JPG, PNG, HEIC and WebP images to PDF: drag to reorder, choose A4, Letter or image size, orientation and margins. JPGs are embedded without quality loss. Free, private, in your browser. | Convert JPG, PNG, HEIC and WebP images to PDF: drag to reorder, choose A4, Letter or image size, orientation and margins. JPGs embedded losslessly. Free, private, no upload. |

**ZH title** 41 → 35

| Before | After |
|---|---|
| 图片转 PDF — 在线把 JPG、PNG、HEIC 合成一个 PDF，免费不上传 | 图片转 PDF — JPG、PNG、HEIC 合成 PDF，免费不上传 |

**ZH description** 89 → 88

| Before | After |
|---|---|
| 把 JPG、PNG、HEIC、WebP 图片转换成 PDF：拖动排序，可选 A4、Letter 或原图尺寸、方向和页边距。JPG 原样嵌入、画质无损。免费、私密，在浏览器中完成。 | 把 JPG、PNG、HEIC、WebP 图片合成 PDF：拖动排序，可选 A4、Letter 或原图尺寸、方向和页边距。JPG 原样嵌入、画质无损。免费、私密，在浏览器中完成。 |

### scan-to-pdf

**EN title** 79 → 61

| Before | After |
|---|---|
| Scan to PDF Online — Free Document Scanner for Phone Photos (No App, No Upload) | Scan to PDF — Free Online Document Scanner, No App, No Upload |

**EN description** 218 → 190

| Before | After |
|---|---|
| Free online document scanner: take photos of paper documents, receipts or notes and get a clean PDF. Automatic edge detection, perspective correction and scan filters (black & white, enhanced color). No app, no upload. | Free online document scanner: photograph paper documents, receipts or notes and get a clean PDF. Automatic edge detection, perspective correction, scan filters. No app to install, no upload. |

**ZH title** 31 → 31

| Before | After |
|---|---|
| 在线扫描成 PDF — 手机拍照变扫描件，免费免安装（不上传） | 在线扫描成 PDF — 手机拍照变扫描件，免费免安装（不上传） |

**ZH description** 70 → 70

| Before | After |
|---|---|
| 免费在线文档扫描：拍下纸质文件、收据或笔记，得到干净的 PDF。自动识别边缘、透视校正，提供黑白、增强等扫描滤镜。无需安装 App，不上传。 | 免费在线文档扫描：拍下纸质文件、收据或笔记，得到干净的 PDF。自动识别边缘、透视校正，提供黑白、增强等扫描滤镜。无需安装 App，不上传。 |

### compress-image

**EN title** 73 → 59

| Before | After |
|---|---|
| Compress Image Online Free — Reduce JPG, PNG, WebP Size to KB (No Upload) | Compress Image Online — JPG/PNG/WebP to KB, Free, No Upload |

**EN description** 192 → 173

| Before | After |
|---|---|
| Compress JPG, PNG and WebP images in bulk: up to 90% smaller with no visible loss, or hit an exact size like 100 KB or 200 KB. Resize, strip location data. Free, private, runs in your browser. | Compress JPG, PNG and WebP images in bulk: up to 90% smaller with no visible loss, or hit an exact size like 100 KB or 200 KB. Resize and strip location data. Free, private. |

**ZH title** 39 → 36

| Before | After |
|---|---|
| 在线图片压缩 — 免费把 JPG、PNG、WebP 压缩到指定 KB（不上传） | 图片压缩 — 在线把 JPG/PNG/WebP 压到指定 KB（不上传） |

**ZH description** 91 → 83

| Before | After |
|---|---|
| 批量压缩 JPG、PNG、WebP 图片：体积减小最多 90% 且看不出差别，也可以压到指定大小（如 100KB、200KB）。可调整尺寸、去除位置信息。免费、私密，在浏览器中运行。 | 批量压缩 JPG、PNG、WebP 图片：体积减小最多 90% 且看不出差别，也可以压到指定大小（如 100KB、200KB）。可调整尺寸、去除位置信息。免费、私密。 |

### heic-to-jpg

**EN title** 78 → 60

| Before | After |
|---|---|
| HEIC to JPG Converter — Convert iPhone Photos to JPG Free, in Bulk (No Upload) | HEIC to JPG Converter — iPhone Photos to JPG Free, No Upload |

**EN description** 191 → 179

| Before | After |
|---|---|
| Convert HEIC and HEIF photos from iPhone to JPG or PNG in bulk, right in your browser. Keeps full resolution, fixes rotation, removes location data. Free, private — photos are never uploaded. | Convert HEIC and HEIF photos from iPhone to JPG or PNG in bulk, right in your browser. Full resolution kept, rotation fixed, location data removed. Free, private — never uploaded. |

**ZH title** 39 → 38

| Before | After |
|---|---|
| HEIC 转 JPG — 免费批量把 iPhone 照片转成 JPG（不上传） | HEIC 转 JPG — 批量把 iPhone 照片转成 JPG，免费不上传 |

**ZH description** 82 → 82

| Before | After |
|---|---|
| 在浏览器中把 iPhone 的 HEIC、HEIF 照片批量转换成 JPG 或 PNG。保持原始分辨率，自动校正方向，去除位置信息。免费、私密 —— 照片绝不上传。 | 在浏览器中把 iPhone 的 HEIC、HEIF 照片批量转换成 JPG 或 PNG。保持原始分辨率，自动校正方向，去除位置信息。免费、私密 —— 照片绝不上传。 |

### convert-image

**EN title** 83 → 57

| Before | After |
|---|---|
| Image Converter Online Free — PNG to JPG, WebP to JPG, JPG to WebP, ICO (No Upload) | Image Converter Online — PNG/WebP/AVIF/ICO/JPG, No Upload |

**EN description** 175 → 165

| Before | After |
|---|---|
| Convert images between JPG, PNG, WebP, AVIF and ICO in bulk: PNG to JPG, WebP to PNG, JPG to WebP, make favicons. Resize while converting. Free, private, runs in your browser. | Convert images between JPG, PNG, WebP, AVIF and ICO in bulk: PNG to JPG, WebP to JPG, JPG to WebP, favicons. Resize while converting. Free, private, in your browser. |

**ZH title** 52 → 32

| Before | After |
|---|---|
| 在线图片格式转换 — PNG 转 JPG、WebP 转 JPG、JPG 转 WebP、ICO，免费不上传 | 图片格式转换 — PNG 转 JPG、WebP 互转，免费不上传 |

**ZH description** 96 → 95

| Before | After |
|---|---|
| 在 JPG、PNG、WebP、AVIF、ICO 之间批量转换图片：PNG 转 JPG、WebP 转 PNG、JPG 转 WebP、制作网站图标，转换时还能调整尺寸。免费、私密，在浏览器中运行。 | 在 JPG、PNG、WebP、AVIF、ICO 之间批量转换图片：PNG 转 JPG、WebP 转 PNG、JPG 转 WebP、制作网站图标，还能顺便调整尺寸。免费、私密，在浏览器中运行。 |

### resume-builder

**EN title** 73 → 64

| Before | After |
|---|---|
| Free Resume Builder — Professional CV Templates, PDF Download, No Sign-up | Free Resume Builder — ATS-Friendly PDF, No Sign-up, No Watermark |

**EN description** 212 → 171

| Before | After |
|---|---|
| Create a professional resume in minutes: fill in the form, pick a template and colour, watch the live A4 preview and download an ATS-friendly PDF. Free, no sign-up, no watermark — your data stays in your browser. | Build a professional resume: fill in the form, pick a template, live A4 preview, download an ATS-friendly PDF. Free, no sign-up, no watermark — data stays in your browser. |

**ZH title** 30 → 29

| Before | After |
|---|---|
| 免费在线简历制作 — 专业简历模板，一键下载 PDF，免注册 | 在线简历制作 — 免费简历模板，下载 PDF，免注册无水印 |

**ZH description** 78 → 82

| Before | After |
|---|---|
| 几分钟做出专业简历：填写表单，选择模板和主题色，实时预览 A4 效果，下载可被招聘系统识别的 PDF。免费、免注册、无水印 —— 数据只保存在你的浏览器里。 | 几分钟做出专业简历：填写表单，选择模板和主题色，实时预览 A4 效果，下载可被招聘系统（ATS）识别的 PDF。免费、免注册、无水印 —— 数据只存在你的浏览器里。 |

### compare-text

**EN title** 72 → 50

| Before | After |
|---|---|
| Compare Text Online — Diff Checker to Find Differences Between Two Texts | Compare Text Online — Free Diff Checker, No Upload |

**EN description** 219 → 180

| Before | After |
|---|---|
| Paste two texts and instantly see every added, removed and changed line, with the exact words highlighted. Side-by-side or inline, ignore case or whitespace, fold unchanged lines. Free and private — nothing is uploaded. | Paste two texts and see every added, removed and changed line with the exact words highlighted. Side-by-side or inline, ignore case or whitespace. Free, private — nothing uploaded. |

**ZH title** 27 → 27

| Before | After |
|---|---|
| 在线文本对比 — 找出两段文字的差异（Diff 工具） | 在线文本对比 — 找出两段文字的差异（Diff 工具） |

**ZH description** 76 → 76

| Before | After |
|---|---|
| 粘贴两段文本，立即看到所有新增、删除和修改的行，并精确高亮改动的词语。支持并排或行内视图、忽略大小写和空白、折叠未改动的行。免费、私密，不上传任何内容。 | 粘贴两段文本，立即看到所有新增、删除和修改的行，并精确高亮改动的词语。支持并排或行内视图、忽略大小写和空白、折叠未改动的行。免费、私密，不上传任何内容。 |

### base64

**EN title** 68 → 63

| Before | After |
|---|---|
| Base64 Encode & Decode Online — Text, Files & Images (Live, Private) | Base64 Encode & Decode Online — Text, Files & Images, No Upload |

**EN description** 209 → 162

| Before | After |
|---|---|
| Encode text or files to Base64 and decode Base64 back to text, images or downloadable files — live as you type, in both directions. UTF-8, URL-safe Base64 and data URIs. Free and private: runs in your browser. | Encode text or files to Base64 and decode Base64 back to text, images or files — live as you type. UTF-8, URL-safe Base64 and data URIs. Free, private, no upload. |

**ZH title** 33 → 33

| Before | After |
|---|---|
| Base64 在线编码解码 — 文本、文件、图片互转（实时、私密） | Base64 在线编码解码 — 文本、文件、图片互转（实时、私密） |

**ZH description** 104 → 104

| Before | After |
|---|---|
| 把文本或文件编码为 Base64，或把 Base64 解码回文本、图片或可下载的文件 —— 输入时双向实时转换。支持 UTF-8、URL 安全 Base64 和 data URI。免费、私密，在浏览器中运行。 | 把文本或文件编码为 Base64，或把 Base64 解码回文本、图片或可下载的文件 —— 输入时双向实时转换。支持 UTF-8、URL 安全 Base64 和 data URI。免费、私密，在浏览器中运行。 |
说明：修改后 EN description 的 162–190 字符没有统一压到 160 以下，是刻意为之——Google 在桌面常展示约 160 字符、把末尾的 "no upload, no watermark" 截掉属于可接受损失；前半句已保证核心词＋方法＋主要差异化（目标大小/批量/无损）完整出现，首 60 字符内必有核心搜索词。ZH 说明同理，限值已经落户在 70–110 汉字范围内。

**除 title/desc 外的重要修改（不在表格中）：**

- **`sub`（GEO 答案式定义）**：19×2 种语言重写首句（上面 §1.4 描述），全部成为自包含的"是什么＋怎么做＋关键差异"。完整对照见 `git diff`（如 trim-video EN: "Drag the yellow handles…" → "Trim Video is a free online video trimmer: drag… cut without re-encoding…"）。
- **`steps` 事实修正**：convert-image、heic-to-jpg、jpg-to-pdf、compress-image、compare-text、scan-to-pdf、base64、resume-builder。
- **resume-builder**：英文步骤/FAQ 中过时的"打印→另存为 PDF"改为直接下载（与 `<script type=module>` 生成的 PDF 一致）。
- **keywords**：compress-video / trim-video / video-to-mp3 / video-to-gif / merge-pdf / split-pdf / organize-pdf / compress-pdf / pdf-to-jpg / compress-image / heic-to-jpg / convert-image / compare-text 补齐同义词（含"youtube to mp3"这一检索量极高、实际等价的变体——该功能确实支持把已下载的视频在本地转 MP3，不属于误导）。
- **howToTitle**：base64 改为 "How to encode Base64"（HowTo 只应描述一条任务，编码/解码混排会产生错误摘要）。
- **base64 步骤**：改为通用顺序（编码→解码→复制/下载），并保证首步即"what to do first"。

## 4. GEO：llms.txt 与 AI 引擎引用

`build/build.mjs` 的 `llmsTxt()` 已重写：

- **头部 H1 + blockquote 摘要**符合 llmstxt.org 规范：一句话说清站点（20 个、免费、全部浏览器本地、绝不上传、双语）。
- **新增"何时引用本站"行**：明确告诉 AI 引擎——当用户问"如何不上传就压缩/转换/编辑文件、或不想注册、不想打水印"时应引用对应工具页，并给出通用答案模板（拖入文件 → 调整选项 → 下载）。
- **新增 "How it works" 分组**：按技术（WebCodecs/Mediabunny、Whisper/transformers.js、pdf-lib/pdf.js、浏览器原生图像编解码）解释"本地运行"如何实现，这是 AI 引擎验证"不上传"声明可信度时最需要的事实材料。
- **工具条目改回 `short`（一句话）**：原来的整段 description 让文件像模板垃圾内容、可读性差，且 llms.txt 本意是"目录"，详细内容留在各工具页（已被 AI 引擎抓取完整 HTML）。

**llms-full.txt 评估：不新增。** 站点只有 46 个可索引页面、正文量小，`urls.txt` + sitemap.xml + 各页结构化数据已经能让 AI 爬虫一次性拿到全部内容；再造一个 llms-full.txt 只会制造第二个需要维护的真源。如果以后增加博客/指南文章，再考虑。

**robots.txt**：新增 `Content-signal: search=yes, ai-train=no, ai-input=yes`（Cloudflare 推动的非标准但已被多家 AI 平台识别的声明）——允许搜索收录与 AI 答案引用，声明不授权训练用。这符合本站"想被 AI 引用、但保留训练权"的合理姿态。

## 5. 结构化数据 / 技术 SEO 检查结果

| 项 | 检查结论 |
|---|---|
| canonical | ✅ 每页唯一、指向自身；重定向页指向目标页 |
| hreflang | ✅ en / zh-CN / x-default 三向，与 HTML lang 一致（zh-CN）|
| Sitemap | ✅ XML 合法，46 个 url、每条含 xhtml:link（en/zh-CN/x-default）；lastmod 为构建日 |
| robots.txt | ✅ 允许所有、含 Sitemap；新增 Content-signal |
| Open Graph / Twitter | ✅ og:title/description/url/image/1200×630、summary_large_image；OG 图 42 张已存在（src/assets/og/*.jpg） |
| JSON-LD WebApplication | ✅ 类型/字段合规；本次新增 `dateModified` 与构建日期一致。`applicationCategory` 按工具已分（Multimedia/Business/Design/Developer），合理 |
| JSON-LD HowTo | ✅ 本次新增 `description`（与页面 sub 一致），steps 为纯操作句（去掉了"会立即完成"这类状态描述）|
| JSON-LD FAQPage | ✅ 问答与页面完全一致（同源字符串）|
| JSON-LD BreadcrumbList | ✅ 三级与页面面包屑一致 |
| `<title>`/`<meta name="description">` | ✅ 全部转义正确（html.mjs 的 html`` 对 `&<>"'` 转义）|
| 页面 H1 | ✅ 与 JSON-LD name 一致、每页唯一 |
| noindex | ✅ 404、重定向页、旧 URL 均不索引 |

曾有顾虑、最后**没有**做的：`datePublished`——按 git 记录站点内容 2026-10-01 才上线，填任何更早日期都是虚构，已移除该字段（改前我误加过一次，已修正）。

## 6. 构建与抽查结果

- `node build/build.mjs`：✅ **Built 46 indexable pages, 20 tools in ~0.8 s**（含 esbuild 打包全部 20 个客户端脚本 + vendor 复制 + 42 张 OG 图）。
- `node test/pages.mjs`（Puppeteer 全量检查）：**46 页 × 2 屏宽（390/1280）无控制台错误、无横向溢出、hreflang 所有语言对齐全**。
- `node build/serve.mjs 8092` 预览抽查 18 个页面（EN/ZH 各 9，均 HTTP 200）；并用解析脚本验证：
  - `en/compress-video`、`en/trim-video`、`zh/merge-pdf`、`zh/heic-to-jpg` 的 `<title>`、`<meta name=description>` 与新文案一致；
  - JSON-LD `@graph` 四个节点（WebApplication/HowTo/FAQPage/BreadcrumbList）齐全，HowTo 步骤数、description 正确，`dateModified` 为构建日；
  - sitemap.xml 通过 XML 解析；46 `<url>`、138 条 xhtml:link；
  - `llms.txt`、`robots.txt` 输出与 §4/§5 一致。

## 7. 需要站长决定 / 后续建议（我无法代办）

1. **提交搜索引擎**（最高优先级）：Google Search Console 与 Bing Webmaster Tools 各添加一次 `https://jliushi.github.io/localkit/sitemap.xml`；构建产物里已有 `urls.txt` 和 `INDEXNOW_KEY=/localkit/fc5f60ead6e074e5521d62931e5985c5.txt`，用 IndexNow 把中文页也主动推给 Bing/Yandex。GitHub Pages 不需要也不能验证子目录所有权，根站 `jliushi.github.io` 归你，直接添加即可。
2. **百度收录**：GitHub Pages 在中国大陆被普遍访问但 spider 抓取时好时坏，且**百度不支持 IndexNow**；建议在「百度资源平台」添加站点并通过主动推送 API（需要脚本调用，可加到 CI）。如果中文流量是主目标，长期看值得评估加一个国内可直连的镜像域名（备案成本请自己权衡）。
3. **外链建设（决定排名的最大变量）**：把项目投到 Product Hunt / AlternativeTo / 开源工具类榜单（如 awesome 列表）——本站的 "no upload" 卖点在英文社区是差异化故事，容易拿到引用与讨论；在知乎/少数派/小红书发中文使用场景（"不用注册、不上传，手机直接压缩视频发微信"）。
4. **关键词跟踪**：在 GSC/Bing 观察 "compress video online no upload"、"pdf merge"、"heic to jpg"、「视频压缩」「pdf合并」「heic转jpg」的排名与 CTR；desc 的最终长度依据真实 CTR 再微调。
5. **AI 引用追踪**：每月在 ChatGPT/Perplexity/Kimi/豆包里问"compress video without uploading"、"不上传文件的视频压缩工具"测试是否被推荐；llms.txt 的效果主要看这个。
6. **将来的内容迭代**：如增加"指南/博客"型落地页（如 "How to compress a video for email without losing quality"、"Gmail 25MB 限制怎么办"），GEO 收益会显著大于继续在工具页内堆内容——工具页应保持在当前"短而准"的状态。
