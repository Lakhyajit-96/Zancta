from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import ExifTags, Image


def json_value(value):
    if isinstance(value, bytes):
        return f"<bytes:{len(value)}>"
    if isinstance(value, tuple):
        return [json_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): json_value(item) for key, item in value.items()}
    return value


def inspect(path: Path) -> dict:
    with Image.open(path) as image:
        exif = {
            ExifTags.TAGS.get(key, str(key)): json_value(value)
            for key, value in image.getexif().items()
        }
        info = {
            str(key): json_value(value)
            for key, value in image.info.items()
            if key != "exif"
        }
        if "exif" in image.info:
            info["exif_bytes"] = f"<bytes:{len(image.info['exif'])}>"
        return {
            "file": path.name,
            "format": image.format,
            "mime": Image.MIME.get(image.format),
            "width": image.width,
            "height": image.height,
            "size_bytes": path.stat().st_size,
            "exif": exif,
            "container_info": info,
        }


if len(sys.argv) != 2:
    raise SystemExit("usage: inspect-metadata.py IMAGE")

print(json.dumps(inspect(Path(sys.argv[1])), ensure_ascii=False))
