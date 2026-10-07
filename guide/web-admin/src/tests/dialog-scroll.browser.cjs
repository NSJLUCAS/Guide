// Real Guide Dialog primitives and CSS; no replacement scroll-lock implementation.
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(check, message) {
  for (let i = 0; i < 80; i++) { if (await check()) return; await delay(25) }
  assert.fail(message)
}
async function touchScroll(page, target) {
  const box = await target.boundingBox(), client = await page.context().newCDPSession(page)
  const x = box.x + box.width / 2, start = box.y + Math.min(box.height - 50, 400)
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] })
    for (let i = 1; i <= 8; i++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start - i * 25 }] })
      await delay(20)
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally { await client.detach() }
}
async function main() {
  const base = process.env.DIALOG_FIXTURE_PREVIEW
  assert.ok(base, 'DIALOG_FIXTURE_PREVIEW is required')
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  try {
    for (const mobile of [false, true]) for (const dark of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 700 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, colorScheme: dark ? 'dark' : 'light' })
      const page = await context.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(base + '/admin/src/tests/dialog-scroll-fixture.html')
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark)
      const overflow = await page.evaluate(() => document.body.style.overflow)
      const locked = () => page.evaluate(() => Number(document.body.getAttribute('data-scroll-locked')) > 0)
      for (let round = 0; round < 3; round++) {
        await page.getByRole('button', { name: '打开长表单', exact: true }).click()
        const outer = page.getByRole('dialog', { name: '长表单滚动回归', exact: true })
        await outer.waitFor(); await until(locked, 'dialog did not lock background')
        const backgroundY = await page.evaluate(() => window.scrollY)
        const box = await outer.boundingBox()
        assert.ok(box.y >= 0 && box.y + box.height <= (mobile ? 700 : 900), 'dialog exceeds viewport')
        assert.ok(await outer.evaluate(e => e.scrollHeight > e.clientHeight), 'long form must overflow')
        if (mobile) await touchScroll(page, outer)
        else { await outer.hover(); await page.mouse.wheel(0, 400) }
        await until(() => outer.evaluate(e => e.scrollTop > 0), 'long form did not scroll')
        assert.equal(await page.evaluate(() => window.scrollY), backgroundY, 'background moved while modal was open')
        await outer.evaluate(e => { e.scrollTop = 0 })
        await outer.getByRole('button', { name: '打开嵌套对话框', exact: true }).click()
        const inner = page.getByRole('dialog', { name: '嵌套对话框', exact: true })
        await inner.waitFor()
        if (mobile) await touchScroll(page, inner)
        else { await inner.hover(); await page.mouse.wheel(0, 300) }
        await until(() => inner.evaluate(e => e.scrollTop > 0), 'nested dialog did not scroll')
        await page.keyboard.press('Escape'); await inner.waitFor({ state: 'hidden' })
        assert.ok(await locked(), 'nested close prematurely unlocked the background')
        await outer.hover(); await page.mouse.wheel(0, 250)
        await until(() => outer.evaluate(e => e.scrollTop > 0), 'outer failed to scroll after nested close')
        await page.keyboard.press('Escape'); await outer.waitFor({ state: 'hidden' })
        await until(async () => !(await locked()), 'body remains locked after all dialogs close')
        assert.equal(await page.evaluate(() => document.body.style.overflow), overflow)
        await page.mouse.move(200, 400); await page.mouse.wheel(0, 300)
        await until(() => page.evaluate(() => window.scrollY > 0), 'background did not resume scrolling')
        await page.evaluate(() => window.scrollTo(0, 0))
      }
      assert.deepEqual(errors, [])
      console.log(`PASS: ${mobile ? 'mobile touch' : 'desktop wheel'} ${dark ? 'dark' : 'light'} long/nested/repeated Dialog and restored body scroll`)
      await context.close()
    }
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
