# U²-Net small (u2netp)

The ONNX weights are an unmodified copy of the model distributed by rembg:

- Original model and Apache-2.0 licence: https://github.com/xuebinqin/U-2-Net
- Licence: https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE
- ONNX download: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
- Export's reference preprocessing and checksum: https://github.com/danielgatis/rembg/blob/main/rembg/sessions/u2netp.py
- Size: 4,574,861 bytes
- MD5 (matches rembg): `8e83ca70e441ab06c318d82300c84806`
- SHA-256: `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`

`config.json` and `preprocessor_config.json` are LocalKit's transformers.js adapter
configuration. Input is RGB, 320 × 320, ImageNet normalization; the first output
is normalized to [0, 1] and resized to the source dimensions as the alpha matte.
Apache-2.0 allows redistribution and commercial use subject to its terms. The
full licence accompanies the weights in `LICENSE`.

These are salient-object segmentation weights. Fine hair, transparent material,
complex backgrounds and low contrast are limitations; results need review.
