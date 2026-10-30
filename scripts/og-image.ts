// Draws public/og.png, the picture shown when the site's link is shared on WhatsApp (1200×630): the logo,
// "40 Days", the start date and the 40-day strip, in the app's own fonts and colours. Rendered in the
// Playwright browser, then squeezed with sharp. Run again after changing the design or dates:
//
//   pnpm og:image

import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { moduleAccents, palette, type ModuleNumber } from '../src/theme/tokens.ts'

const dataUri = (path: string, type: string) => `data:${type};base64,${readFileSync(path).toString('base64')}`
const font = (file: string) => dataUri(`node_modules/@fontsource/${file}`, 'font/woff2')

const modules: ModuleNumber[] = [1, 2, 3, 4, 5]
const strip = modules
  .map(
    (module) =>
      `<div class="group">${Array.from({ length: 8 }, () => `<span style="background:${moduleAccents[module].base}"></span>`).join('')}</div>`,
  )
  .join('')

const html = `<!doctype html>
<html><head><style>
  @font-face { font-family: 'Barlow Condensed'; font-weight: 700; src: url(${font('barlow-condensed/files/barlow-condensed-latin-700-normal.woff2')}) format('woff2'); }
  @font-face { font-family: 'Manrope'; font-weight: 600; src: url(${font('manrope/files/manrope-latin-600-normal.woff2')}) format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: ${palette.cream}; color: ${palette.ink};
         font-family: 'Manrope', sans-serif; padding: 70px 80px; display: flex; flex-direction: column;
         justify-content: space-between; overflow: hidden; position: relative; }
  body::before { content: ''; position: absolute; inset: 0; z-index: -1;
         background: radial-gradient(700px 520px at 105% -10%, ${palette.amber}33, transparent 70%),
                     radial-gradient(600px 480px at -10% 110%, ${palette.purple}14, transparent 70%); }
  img { width: 380px; height: auto; }
  h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 190px; line-height: 0.9;
       letter-spacing: -2px; }
  p { font-size: 40px; font-weight: 600; color: ${palette.inkSoft}; margin-top: 18px; }
  .strip { display: flex; gap: 18px; }
  .group { display: flex; gap: 5px; flex: 1; }
  .group span { flex: 1; height: 16px; border-radius: 8px; }
</style></head>
<body>
  <img src="${dataUri('src/assets/brand/logo.webp', 'image/webp')}" alt="">
  <div>
    <h1>40 Days</h1>
    <p>Starts Saturday 14 November · leads into WOFBEC 2027</p>
  </div>
  <div class="strip">${strip}</div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
const shot = await page.screenshot({ type: 'png' })
await browser.close()

// A palette PNG keeps flat colours sharp and the file small (WhatsApp is happiest under 300 KB).
const info = await sharp(shot).png({ palette: true, quality: 90, effort: 10 }).toFile('public/og.png')
console.log(`✓ public/og.png ${info.width}×${info.height}, ${(info.size / 1000).toFixed(1)} kB`)
