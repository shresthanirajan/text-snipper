# Third-party components

Project-specific code and icons are covered by the root MIT license. Vendored
components remain covered by their upstream licenses and attribution notices.

| Component | Version / origin | License and files |
| --- | --- | --- |
| Tesseract.js | 6.0.1; https://github.com/naptha/tesseract.js | Apache-2.0; `vendor/TESSERACT-LICENSE.md` |
| Tesseract.js core | 6.1.2; https://github.com/naptha/tesseract.js-core | Apache-2.0; `vendor/core/LICENSE` |
| English trained data | `@tesseract.js-data/eng` 1.0.0, `4.0.0/eng.traineddata.gz`; https://github.com/naptha/tessdata | See `vendor/lang/LICENSE` for the upstream trained-data license |

Keep `tesseract.min.js.LICENSE.txt` and `worker.min.js.LICENSE.txt` alongside the
bundles: they preserve notices for included libraries. The original npm
dependency-resolution record is kept at `vendor/dependencies-lock.json` for
provenance; it is not an instruction to install dependencies in the extension.

## Why there are two core files

OCR uses LSTM mode (`createWorker("eng", 1, ...)`). The loader chooses between
`tesseract-core-lstm.wasm.js` and `tesseract-core-simd-lstm.wasm.js` according to
browser WebAssembly SIMD support. Both files embed their WebAssembly bytes.
The unused legacy-engine and separate `.wasm` variants are not shipped.

Do not remove one of the two included cores just because your computer uses
the other. Do not replace local files with CDN URLs: that would change offline
behavior and conflict with the intended extension code policy.
