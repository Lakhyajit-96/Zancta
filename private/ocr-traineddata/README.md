Language packs are Apache-2.0 tessdata_fast models from
https://github.com/tesseract-ocr/tessdata_fast

Each file is the upstream `.traineddata` gzip-compressed without other modification,
matching the shipped English pack in public/ocr/.

These files are served only to authenticated Premium sessions from
GET /api/ocr/lang/{lang}.traineddata.gz — they are not in the public bundle.
