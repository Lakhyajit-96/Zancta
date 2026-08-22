# OCR License Audit

**Verification date:** 2026-08-18  
**Decision:** **VERIFIED — approved for this implementation**

## Shipped OCR components

| Component | Exact version / source | License | Commercial use, redistribution, modification, self-hosting | Provenance / SHA-256 |
| --- | --- | --- | --- | --- |
| `tesseract.js` | `7.0.0`, [npm](https://registry.npmjs.org/tesseract.js/-/tesseract.js-7.0.0.tgz), [repository](https://github.com/naptha/tesseract.js) | Apache-2.0 | Permitted under Apache-2.0, subject to license/NOTICE obligations | npm manifest and repository license verified 2026-08-18 |
| Tesseract browser worker | `tesseract.js@7.0.0/dist/worker.min.js` | Apache-2.0 | Same as package | `576b7df7e3393e137e51849357c9adb53fe7ac1bb69bfa06cf3d61520f182c6d` |
| `tesseract.js-core` | `7.0.0`, [npm](https://registry.npmjs.org/tesseract.js-core/-/tesseract.js-core-7.0.0.tgz), [repository](https://github.com/naptha/tesseract.js-core) | Apache-2.0 | Permitted under Apache-2.0, subject to license/NOTICE obligations | Installed package `LICENSE` and repository license verified 2026-08-18 |
| WASM core loaders and binaries | `tesseract.js-core@7.0.0`, copied without modification to `public/ocr/` | Apache-2.0 | Permitted under Apache-2.0 | Checksums below |
| English language data | [`tesseract-ocr/tessdata_fast` `main` `eng.traineddata`](https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata), gzip-compressed locally without content modification | Apache-2.0 | Permitted under Apache-2.0 | `adfb2e282e07c14e2940e6f79e8095cad1ef0e9a663cda3c89a24e9d4a0a5cbd` for shipped `eng.traineddata.gz` |
| Hindi, Bengali, Tamil, Spanish, French, German language data | [`tesseract-ocr/tessdata_fast` `main` `{lang}.traineddata`](https://github.com/tesseract-ocr/tessdata_fast), gzip-compressed locally into `private/ocr-traineddata/` | Apache-2.0 | Permitted under Apache-2.0 | Served only via entitlement-gated `/api/ocr/lang/`. SHA-256: hin `2bc56d6b657329759a9e10759cc157ad9d546e91e0698c04d23a36df43d97986`; ben `a340f9b90560794b3ad23582c561bdc1453958443a40de647762e484afbf4b47`; tam `bbcd68ec0960152b72920b94dd145da8bb0c23dfb00a3c4e0cd22272dcd52b24`; spa `b088edf7bb347765cac72538cae5665d97dc442890341356c80f38efb70b3ce0`; fra `09ca4bc39c0764b4a7766204f64cf73b47720fad566b478ac46b2f364b1fff82`; deu `98e6a6c6724ae7abf773a82bf0dd67ca2c66b3c1e0f99a3ab57ec33c76c01786` |

`Tesseract.js-core` is the WebAssembly/Emscripten distribution of the Apache-2.0 Tesseract OCR engine. It is **not** MIT-licensed; the prior draft’s MIT claim was removed.

## Shipped core checksums

| Files | SHA-256 |
| --- | --- |
| `tesseract-core.wasm` / `.wasm.js` | `c7f5ace62ac0ad065e71e9c6725f1d7cdf82e7eda8fba532cbb9563964da7098` / `0bc6ce3e5fbbd0cd89706cf2fd70960e3372f4f01ee24265b26990808aaeb286` |
| `tesseract-core-lstm.wasm` / `.wasm.js` | `66b17df6e20c5329a17ffa9c202a47eaa3e32500b253d4c7f38e7f2bc01457c3` / `eef5f8b2f8e20e150680b20adaec4a60babafee3adbe8a94583c81fee46e8680` |
| `tesseract-core-simd.wasm` / `.wasm.js` | `7d237a13edfeb0fa2f104744fccde0a00e0c076c3e23b7a8fc7af75ec9af2c3e` / `6b61ef4e911b5cf57e656bbfe983d6e2b3711a02dd164154ddda064566e8e09d` |
| `tesseract-core-simd-lstm.wasm` / `.wasm.js` | `34e8d50cac216427d86bf397d610fdd9f49492539bbcdfbfccc4eda20c810bea` / `c58b46a4c796c0b8afccf77591d5b875b6896b45d402bbce8caa6f5362447b38` |
| `tesseract-core-relaxedsimd.wasm` / `.wasm.js` | `45f8c9b516df326b6ae6b493ed3a6289df5cbd10490e7b6ff8bf5b12ea42d1da` / `843074aa5bad1cc6421b74a86201768ced9f244795e4d81435435a61a40ce535` |
| `tesseract-core-relaxedsimd-lstm.wasm` / `.wasm.js` | `7985c92d4c64e7267d24cadffe1b2a1da6bf8aa55fdcaf953fe94fe122a24545` / `861a536cf9ef8e63cb644d57bab39c388f37f7d6b6f60024b741c5f6b39a59b3` |

The full set is necessary because Tesseract.js selects the best compatible implementation at runtime; no CDN fallback is configured.

## Runtime dependency record

`tesseract.js@7.0.0` resolves: `bmp-js@0.1.0`, `idb-keyval@6.3.0`, `is-url@1.2.4`, `node-fetch@2.7.0`, `opencollective-postinstall@2.0.3`, `regenerator-runtime@0.13.11`, `wasm-feature-detect@1.9.0`, and `zlibjs@0.3.1`. These are npm package dependencies, not independently served public OCR assets. Their exact locked versions are recorded in `package-lock.json`.

## Sources and implementation constraints

- [Tesseract.js local-installation documentation](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md) verifies explicit `workerPath`, `corePath`, and `langPath` support.
- [Tesseract.js API documentation](https://github.com/naptha/tesseract.js/blob/master/docs/api.md) verifies browser-worker operation.
- [Tesseract core license](https://github.com/naptha/tesseract.js-core/blob/master/LICENSE), [Tesseract engine license](https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE), and [tessdata_fast license](https://github.com/tesseract-ocr/tessdata_fast/blob/main/LICENSE) verify Apache-2.0 coverage for the shipped OCR assets.
- Assets are served only from `/ocr/*` on this site. `connect-src` remains `'self'`; no OCR CDN, service, API, telemetry, or document-upload endpoint is used.

No model source with ambiguous rights was used. Background-removal assets remain **DEFERRED** and were not installed or changed.
