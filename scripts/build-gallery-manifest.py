#!/usr/bin/env python3
"""
Regenerate images/gallery/manifest.json from whatever image files sit in
images/gallery/. Run this after adding or removing photos from that folder:

    python scripts/build-gallery-manifest.py

It keeps the existing "alt" text for files it already knows about (edit
manifest.json directly to fix a caption) and only invents a placeholder
alt text for brand-new files, so re-running it is always safe.
"""
import json
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_DIR = os.path.join(ROOT, "images", "gallery")
MANIFEST_PATH = os.path.join(GALLERY_DIR, "manifest.json")
EXTS = (".jpg", ".jpeg", ".png", ".webp")


def humanize(filename):
    name = os.path.splitext(filename)[0]
    name = name.replace("-", " ").replace("_", " ").strip()
    return name[:1].upper() + name[1:] if name else filename


def main():
    if not os.path.isdir(GALLERY_DIR):
        sys.exit(f"No such folder: {GALLERY_DIR}")

    existing = {}
    if os.path.isfile(MANIFEST_PATH):
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            for entry in json.load(f):
                existing[entry["file"]] = entry

    files = sorted(
        f for f in os.listdir(GALLERY_DIR)
        if f.lower().endswith(EXTS)
    )

    manifest = []
    for f in files:
        path = os.path.join(GALLERY_DIR, f)
        with Image.open(path) as im:
            width, height = im.size
        alt = existing.get(f, {}).get("alt") or humanize(f)
        manifest.append({"file": f, "alt": alt, "width": width, "height": height})

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Wrote {len(manifest)} entries to {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
