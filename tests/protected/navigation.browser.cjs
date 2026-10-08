// Test-layer API fixtures only. No public services or production Hub are contacted.
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const dist = path.resolve(__dirname, '../../navigation-theme/dist')
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      const file = path.resolve(dist, '.' + (url.pathname === '/' ? '/index.html' : url.pathname))
      if (!file.startsWith(dist + path.sep)) { res.writeHead(403).end(); return }
      const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'
      res.writeHead(200, { 'Content-Type': type })
      res.end(await fs.readFile(file))
    } catch { res.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
    const page = await browser.newPage({ colorScheme: 'light' })
    await page.addInitScript(() => localStorage.setItem('theme', 'light'))
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()) })
    let style = 'standard'
    let stale = false
    await page.route('**/api/**', route => {
      const endpoint = new URL(route.request().url()).pathname
      let value
      if (endpoint === '/api/public-config') value = { cardStyle: style }
      else if (endpoint === '/api/services') value = ['online', 'offline', 'protected', 'unknown', 'unchecked'].map((status, index) => ({
        id: index + 1, name: `Fixture ${status}`, url: 'https://example.com/', description: 'Website check fixture',
        icon: null, category: 'Test', checkEnabled: status !== 'unchecked', status, responseMs: 999,
        checkedAt: ['unknown', 'unchecked'].includes(status) ? null : new Date(Date.now() - (stale ? 181_000 : 1000)).toISOString(),
      }))
      else return route.fulfill({ status: 404, body: '' })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) })
    })
    const url = `http://127.0.0.1:${server.address().port}/`
    for (style of ['standard', 'compact', 'minimal']) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 960 })
        await page.goto(url)
        const card = page.locator('[data-service-id="3"]')
        await card.getByText('检测受限', { exact: true }).waitFor()
        await page.locator(`[data-service-id="3"][data-card-style="${style}"]`).waitFor()
        assert.equal(await card.getByText('999 ms', { exact: true }).count(), 0)
        assert.equal(await card.getByRole('link').count(), 1)
        assert.match(await page.locator('[aria-label="网站统计"]').innerText(), /1 个检测受限/)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
        if (width === 390) {
          await page.getByRole('button', { name: /切换.*色/ }).click()
          assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), true)
          assert.equal(await card.getByText('检测受限', { exact: true }).count(), 1)
        }
        if (process.env.GUIDE_SCREENSHOT_DIR) {
          await page.screenshot({ path: path.join(process.env.GUIDE_SCREENSHOT_DIR, `${style}-${width}.png`), fullPage: true })
        }
      }
    }
    stale = true
    await page.reload()
    await page.locator('[data-service-id="3"]').getByText('未知', { exact: true }).waitFor()
    assert.equal(await page.getByText('检测受限', { exact: true }).count(), 0)
    assert.deepEqual(errors, [])
    console.log('PASS: protected/old states, three card styles, desktop/mobile, dark mode, summary, no fake latency, expired state, no overflow or console errors.')
  } finally {
    if (browser) await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
