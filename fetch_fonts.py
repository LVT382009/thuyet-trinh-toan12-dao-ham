#!/usr/bin/env python3
"""Fetch Google Fonts woff2 (vietnamese + latin subsets) into assets/fonts."""
import os, re, urllib.request, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
FONTS = ROOT / "assets" / "fonts"
FONTS.mkdir(parents=True, exist_ok=True)
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

JOBS = [
    ("playfair", "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,800;0,900;1,600&display=swap"),
    ("plexmono", "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"),
]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

out_css = []
for name, url in JOBS:
    css = fetch(url)
    # split into blocks with their preceding comment
    parts = re.split(r"/\*\s*([a-z-]+)\s*\*/", css)
    # parts: ['', 'cyrillic', '@font-face{...}', 'vietnamese', '@font-face{...}', ...]
    it = iter(parts[1:])
    for subset, block in zip(it, it):
        if subset not in ("vietnamese", "latin"):
            continue
        m = re.search(r"url\((https://[^)]+\.woff2)\)", block)
        if not m:
            continue
        src = m.group(1)
        fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        urange = re.search(r"unicode-range:\s*([^;]+);", block).group(1)
        slug = f"{name}-{weight}-{style}-{subset}.woff2"
        dest = FONTS / slug
        if not dest.exists():
            req = urllib.request.Request(src, headers={"User-Agent": UA})
            dest.write_bytes(urllib.request.urlopen(req, timeout=30).read())
        block = block.replace(src, slug)
        out_css.append(block.strip())
        print(f"{fam} {weight} {style} {subset} -> {slug}")

(FONTS / "fonts-extra.css").write_text("\n".join(out_css) + "\n", encoding="utf-8")
print("wrote fonts-extra.css")
