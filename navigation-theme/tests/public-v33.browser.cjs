const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const base = process.env.NAVIGATION_PREVIEW
  assert.ok(base, 'NAVIGATION_PREVIEW must point at an existing local production preview')
  const origin = new URL(base).origin
  const output = process.env.V33_PUBLIC_SCREENSHOTS || path.join(__dirname, 'artifacts-v33')
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, colorScheme: 'light' })
  const page = await context.newPage()
  page.setDefaultTimeout(6000)
  const errors = [], apiPaths = []
  let config = { cardStyle: 'standard' }, fail = '', delay = 0, active = 0, maxActive = 0, stale = false
  let configCalls = 0, serviceCalls = 0
  page.on('pageerror', error => errors.push(error.message))
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin !== origin) {
      return route.fulfill(url.pathname.endsWith('broken.png') ? { status: 404, body: '' } : {
        status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="blue"/></svg>',
      })
    }
    if (!url.pathname.startsWith('/api/')) return route.continue()
    apiPaths.push(url.pathname)
    assert.equal(request.method(), 'GET')
    if (url.pathname === '/api/public-config') {
      configCalls++
      active++; maxActive = Math.max(maxActive, active)
      const current = config, currentFailure = fail
      try {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay))
        if (currentFailure === 'network') return await route.abort('failed')
        if (currentFailure === 'http') return await route.fulfill({ status: 503, body: 'unavailable' })
        if (currentFailure === 'json') return await route.fulfill({ status: 200, contentType: 'application/json', body: 'invalid JSON' })
        return await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) })
      } finally { active-- }
    }
    if (url.pathname === '/api/services') {
      serviceCalls++
      const services = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1, name: i === 4 ? '很长的网站名称用于测试截断与响应布局' : `网站 ${i + 1}`,
        description: `简介 ${i + 1}：用于网站访问的简短说明`, category: i % 2 ? '开发工具' : '影音娱乐',
        icon: i === 0 ? 'github' : i === 1 ? 'https://images.example.com/broken.png' : i === 2 ? 'https://images.example.com/ok.svg' : null,
        url: `https://service.example.com/${i + 1}`, status: ['online', 'offline', 'unknown', 'unchecked'][i % 4],
        responseMs: i % 4 === 0 ? 86 : null, checkEnabled: i % 4 !== 3,
        checkedAt: new Date(Date.now() - (stale ? 181000 : 1000)).toISOString(),
      }))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(services) })
    }
    throw new Error(`Unexpected public API request: ${url.pathname}`)
  })
  const cards = () => page.locator('[data-service-id]')
  const first = () => page.locator('[data-service-id="1"]')
  const styleIs = async style => {
    await page.waitForFunction(style => document.querySelector('[data-service-id]')?.getAttribute('data-card-style') === style, style)
    assert.equal(await cards().count(), 12)
  }
  const refresh = () => page.evaluate(() => {
    const channel = new BroadcastChannel('navigation-appearance')
    channel.postMessage({ type: 'refresh', cardStyle: 'ignored' }); channel.close()
  })
  const columns = () => page.getByLabel('网站列表').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)
  const heights = {}
  try {
    await page.goto(base)
    await page.waitForFunction(() => document.querySelectorAll('[data-service-id]').length === 12)
    await page.waitForFunction(() => !document.querySelector('[data-service-id="2"] img'))
    assert.equal(await page.title(), 'Guide')
    assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'Guide')
    assert.equal(await first().locator('svg.lucide-globe').count(), 1, 'legacy github icon should use the generic fallback')
    const baselinePath = process.env.V33_STANDARD_BASELINE
    if (process.env.V33_CAPTURE_BASELINE === '1') {
      assert.ok(baselinePath, 'V33_STANDARD_BASELINE is required for baseline capture')
      await fs.writeFile(baselinePath, JSON.stringify({ html: await first().evaluate(node => node.outerHTML), height: (await first().boundingBox()).height }))
      await page.screenshot({ path: path.join(output, 'standard-v32-desktop-light.png'), fullPage: true })
      console.log('Captured existing v3.2 standard DOM and screenshot')
      return
    }
    await styleIs('standard')
    assert.equal(await columns(), 4)
    assert.equal(await page.getByLabel('网站列表').getAttribute('class'), 'grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
    assert.match(await first().getAttribute('class'), /gap-0 p-4/)
    assert.equal(await first().locator('dl dt').allTextContents().then(values => values.join(',')), '分类,响应时间,地址,最近检测')
    heights.standard = (await first().boundingBox()).height
    if (baselinePath) {
      const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'))
      const html = await first().evaluate(node => node.outerHTML.replace(' data-card-style="standard"', ''))
      // This response timestamp changes between runs; preserve every DOM/class field.
      const timestampNeutral = value => value.replace(/title="\d{4}-\d\d-\d\dT[^"]+"/g, 'title="CHECKED_AT"')
      assert.equal(timestampNeutral(html), timestampNeutral(baseline.html), 'standard card DOM and classes remain identical to v3.2')
      assert.equal(heights.standard, baseline.height)
    }
    await page.screenshot({ path: path.join(output, 'standard-desktop-light.png'), fullPage: true })
    for (const [id, label] of [[2, '离线'], [3, '未知'], [4, '未检测']]) {
      const text = await page.locator(`[data-service-id="${id}"]`).innerText()
      assert.ok(text.includes(label)); assert.ok(!/\d+\s*ms/.test(text))
    }
    await page.getByRole('button', { name: '切换深色', exact: true }).click()
    await page.screenshot({ path: path.join(output, 'standard-desktop-dark.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(await columns(), 1)
    await page.screenshot({ path: path.join(output, 'standard-mobile-dark.png'), fullPage: true })
    await page.getByRole('button', { name: '切换浅色', exact: true }).click()
    await page.screenshot({ path: path.join(output, 'standard-mobile-light.png'), fullPage: true })
    await page.setViewportSize({ width: 1600, height: 1100 })

    for (const style of ['compact', 'minimal']) {
      config = { cardStyle: style }
      await refresh(); await styleIs(style)
      assert.equal(await columns(), 6)
      await page.waitForTimeout(200) // Let the original Button transition finish after a viewport change.
      heights[style] = (await first().boundingBox()).height
      assert.ok(heights[style] < heights.standard, `${style} must be shorter than standard`)
      assert.match(await first().innerText(), /在线/)
      assert.match(await first().innerText(), /86 ms/)
      for (const [id, status] of [[2, '离线'], [3, '未知'], [4, '未检测']]) {
        const text = await page.locator(`[data-service-id="${id}"]`).innerText()
        assert.ok(text.includes(status)); assert.ok(text.includes('—')); assert.ok(!/\d+\s*ms/.test(text))
      }
      assert.equal(await page.locator('[data-service-id="2"] img').count(), 0, 'broken HTTPS icon falls back')
      assert.equal(await page.locator('[data-service-id="2"] svg').count(), 2)
      assert.equal(await page.locator('[data-service-id="3"] img').count(), 1)
      if (style === 'compact') {
        assert.match(await first().innerText(), /简介 1/); assert.match(await first().innerText(), /影音娱乐/)
      } else {
        assert.equal(await first().locator('p,dl').count(), 0)
        assert.ok(!(await first().innerText()).includes('简介'))
      }
      const link = first().getByRole('link', { name: '访问 网站 1（新窗口）' })
      assert.equal(await link.getAttribute('href'), 'https://service.example.com/1')
      assert.equal(await link.getAttribute('target'), '_blank')
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer')
      await page.screenshot({ path: path.join(output, `${style}-desktop-light.png`), fullPage: true })
      await page.getByRole('button', { name: '切换深色', exact: true }).click()
      await page.screenshot({ path: path.join(output, `${style}-desktop-dark.png`), fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
      assert.equal(await columns(), 1)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.waitForFunction(() => document.querySelector('[data-service-id="1"] a').getBoundingClientRect().height >= 44)
      const bounds = await link.boundingBox()
      assert.ok(bounds.height >= 44 && bounds.width >= 44, `phone visit link has a touch target: ${JSON.stringify(bounds)}`)
      await page.screenshot({ path: path.join(output, `${style}-mobile-dark.png`), fullPage: true })
      await page.getByRole('button', { name: '切换浅色', exact: true }).click()
      await page.screenshot({ path: path.join(output, `${style}-mobile-light.png`), fullPage: true })
      for (const [width, count] of [[640, 2], [768, 3], [1024, 4], [1280, 5], [1600, 6]]) {
        await page.setViewportSize({ width, height: 1100 })
        await page.waitForFunction(count => getComputedStyle(document.querySelector('[aria-label="网站列表"]')).gridTemplateColumns.split(' ').length === count, count)
      }
    }
    assert.ok(heights.minimal < heights.compact)

    // The server fixture, rather than localStorage, remains authoritative after reload.
    await page.evaluate(() => localStorage.setItem('service_card_style', 'compact'))
    await page.reload(); await styleIs('minimal')
    assert.equal(await page.evaluate(() => localStorage.getItem('service_card_style')), 'compact')
    const servicesBefore = serviceCalls
    const pollsBefore = configCalls
    config = { cardStyle: 'compact' }
    await styleIs('compact')
    assert.ok(configCalls > pollsBefore, 'independent five-second config poll updates appearance')
    assert.equal(serviceCalls, servicesBefore, 'config refresh does not restart service polling')

    config = { cardStyle: 'minimal' }; delay = 200
    await refresh()
    await page.evaluate(() => { for (let i = 0; i < 20; i++) window.dispatchEvent(new Event('focus')) })
    await styleIs('minimal')
    await page.waitForTimeout(450); delay = 0
    assert.equal(maxActive, 1, 'appearance requests never overlap under refresh bursts')

    config = { cardStyle: 'compact' }
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await styleIs('compact')
    config = { cardStyle: 'minimal' }
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await styleIs('minimal')

    for (const failure of ['http', 'json', 'network']) {
      fail = failure; await refresh(); await styleIs('standard')
      fail = ''; await refresh(); await styleIs('minimal')
    }
    config = { cardStyle: 'invalid' }; await refresh(); await styleIs('standard')
    config = { cardStyle: 'minimal' }; await refresh(); await styleIs('minimal')
    stale = true; await page.reload(); await styleIs('minimal')
    assert.match(await first().innerText(), /未知/)
    assert.ok(!(await first().innerText()).includes('86 ms'))
    // Minimal still searches descriptions and filters categories using the original model.
    await page.getByRole('searchbox', { name: '搜索网站' }).fill('简介 12：')
    assert.equal(await cards().count(), 1)
    await page.getByRole('button', { name: '清除搜索' }).click()
    await page.getByRole('group', { name: '网站分类' }).getByRole('button', { name: '开发工具' }).click()
    assert.equal(await cards().count(), 6)
    assert.deepEqual([...new Set(apiPaths)].sort(), ['/api/public-config', '/api/services'])
    assert.deepEqual(errors, [])
    console.log(`public v3.3 fixture passed: ${JSON.stringify({ heights, configCalls, serviceCalls, maxActive, apiPaths: [...new Set(apiPaths)], output })}`)
  } finally { await browser.close() }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
