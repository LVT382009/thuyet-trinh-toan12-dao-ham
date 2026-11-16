#!/usr/bin/env python3
"""Render every slide of the deck to PNG + report console errors."""
import asyncio, os, sys, json
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
OUT = HERE / "render"
OUT.mkdir(exist_ok=True)
URL = (HERE / "index.html").as_uri()
CHROME = os.environ.get("DECK_CHROME",
    r"C:\Users\Ha Trung\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe")
only = sys.argv[1] if len(sys.argv) > 1 else None

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pg = await b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        errs = []
        pg.on("console", lambda m: errs.append((m.type, m.text[:200])) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: errs.append(("pageerror", str(e)[:300])))
        await pg.goto(URL, wait_until="load")
        await pg.wait_for_timeout(1200)
        n = await pg.evaluate("document.querySelectorAll('.slide').length")
        report = {"slides": n, "errors": [], "warnings": []}
        for i in range(1, n + 1):
            await pg.evaluate(f"location.hash='#{i}'; window.dispatchEvent(new Event('resize'))")
            await pg.evaluate(f"document.querySelectorAll('.slide').forEach((s,k)=>s.classList.toggle('active',k==={i-1}))")
            await pg.wait_for_timeout(1900)
            await pg.screenshot(path=str(OUT / f"slide_{i:02d}.png"))
            txt = await pg.evaluate("document.body.innerText.length")
            print(f"slide {i}: text={txt}")
        report["errors"] = [e for e in errs if e[0] in ("error", "pageerror")]
        report["warnings"] = [e for e in errs if e[0] == "warning"]
        (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print("ERRORS:", report["errors"][:6])
        print("WARNINGS:", report["warnings"][:6])
        await b.close()

asyncio.run(main())
