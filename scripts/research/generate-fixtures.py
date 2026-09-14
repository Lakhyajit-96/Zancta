from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, PngImagePlugin


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate-fixtures.py OUTPUT_DIR")

    output_dir = Path(sys.argv[1])
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.new("RGB", (320, 200), (235, 240, 248))
    ImageDraw.Draw(image).text((20, 80), "Synthetic EXIF Test", fill=(10, 20, 30))

    exif = Image.Exif()
    exif[0x010F] = "ZANCTA Test Camera"
    exif[0x0110] = "Model-8E"
    exif[0x0132] = "2026:09:14 12:34:56"
    exif[0x9003] = "2026:09:14 12:34:56"
    exif_bytes = exif.tobytes()

    image.save(output_dir / "synthetic-exif.jpg", format="JPEG", quality=95, exif=exif_bytes)
    image.save(output_dir / "synthetic-metadata.webp", format="WEBP", quality=95, exif=exif_bytes)

    png_info = PngImagePlugin.PngInfo()
    png_info.add_text("Software", "ZANCTA synthetic metadata fixture")
    png_info.add_text("Comment", "Synthetic metadata test")
    png_info.add_text("Creation Time", "2026-09-14T12:34:56Z")
    image.save(output_dir / "synthetic-metadata.png", format="PNG", pnginfo=png_info)

    manifest = {
        "generator": "scripts/research/generate-fixtures.py",
        "dimensions": [320, 200],
        "gps": "DATA_UNAVAILABLE",
        "fixtures": [
            {
                "file": "synthetic-exif.jpg",
                "format": "JPEG",
                "metadata": {"Make": "ZANCTA Test Camera", "Model": "Model-8E", "DateTime": "2026:09:14 12:34:56", "DateTimeOriginal": "2026:09:14 12:34:56"},
            },
            {
                "file": "synthetic-metadata.webp",
                "format": "WebP",
                "metadata": {"Make": "ZANCTA Test Camera", "Model": "Model-8E", "DateTime": "2026:09:14 12:34:56", "DateTimeOriginal": "2026:09:14 12:34:56"},
            },
            {
                "file": "synthetic-metadata.png",
                "format": "PNG",
                "metadata": {"Software": "ZANCTA synthetic metadata fixture", "Comment": "Synthetic metadata test", "Creation Time": "2026-09-14T12:34:56Z"},
            },
        ],
    }
    (output_dir / "fixtures.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
