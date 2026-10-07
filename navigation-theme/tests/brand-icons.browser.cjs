const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

// Restoring any built-in brand branch must fail the legacy/name assertions;
// dropping URL support must fail image loading, privacy and recovery assertions.
async function main() {
  assert.ok(process.env.NAVIGATION_PREVIEW, 'NAVIGATION_PREVIEW must point at the local Vite fixture server')
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  const page = await browser.newPage()
  const errors = []
  const brandedIcons = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://icons.example.com/**', route => route.fulfill(route.request().url().endsWith('broken.png')
    ? { status: 404, body: '' }
    : { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="blue"/></svg>' }))
  try {
    await page.goto(new URL('/tests/brand-icons-fixture.html', process.env.NAVIGATION_PREVIEW).href)
    await page.waitForSelector('[data-service-id]')
    for (const style of ['standard', 'compact', 'minimal']) {
      const section = page.locator(`[data-style="${style}"]`)
      for (const id of [...Array(17).keys(), 19, 20]) {
        const card = section.locator(`[data-service-id="${id}"]`)
        if (await card.locator('svg.lucide-globe').count() !== 1) brandedIcons.push(`${style} ${await card.locator('h2').innerText()} must use Globe`)
        assert.equal(await card.locator('img').count(), 0)
      }
      const image = section.locator('[data-service-id="17"] img')
      await image.waitFor()
      assert.equal(await image.getAttribute('src'), 'https://icons.example.com/ok.svg')
      assert.equal(await image.getAttribute('referrerpolicy'), 'no-referrer')
      assert.equal(await image.getAttribute('alt'), '')
      await page.waitForFunction(style => document.querySelector(`[data-style="${style}"] [data-service-id="17"] img`)?.naturalWidth > 0, style)
      await page.waitForFunction(style => !!document.querySelector(`[data-style="${style}"] [data-service-id="18"] .lucide-globe`), style)
      assert.equal(await section.locator('[data-service-id="18"] img').count(), 0, `${style} failed image falls back`)
    }
    const recovery = page.locator('[data-recovery]')
    await recovery.locator('svg.lucide-globe').waitFor()
    await page.getByRole('button', { name: 'Change icon URL' }).click()
    await page.waitForFunction(() => document.querySelector('[data-recovery] img')?.naturalWidth > 0)
    assert.equal(await recovery.locator('img').getAttribute('src'), 'https://icons.example.com/second.svg', 'new URL recovers after a previous URL failed')
    for (const node of await page.locator('[data-os]').all()) {
      if (await node.locator('svg.lucide-globe').count() !== 1) brandedIcons.push(`${await node.getAttribute('data-os')} must use generic Globe`)
      assert.ok((await node.locator('svg title').textContent()).length > 0, 'OS title remains available')
    }
    assert.deepEqual(errors, [])
    assert.deepEqual(brandedIcons, [], 'legacy keys and OS names must never render built-in brand logos')
    console.log('brand icons: 3 styles × 21 cases, failed URL recovery and 12 OS variants passed')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
