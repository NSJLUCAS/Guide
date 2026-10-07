// Production UI regression; intercept only API/catalog/image boundaries.
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const base = process.env.SERVICE_ADMIN_PREVIEW
  assert.ok(base, 'SERVICE_ADMIN_PREVIEW must point at a local production preview')
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(5000)
    const errors = [], external = []
    page.on('pageerror', error => errors.push(error.message))
    let authed = false, config = { activeId: '', libraries: [] }
    let service = { id: 1, name: 'Own service', url: 'https://service.example.com', description: '', category: '', icon: null,
      sort: 0, public: true, enabled: true, checkEnabled: true, createdAt: 1, updatedAt: 2,
      status: 'unknown', responseMs: null, checkedAt: null }
    await page.route('https://**/*', route => {
      const url = route.request().url(); external.push(url)
      return route.fulfill(url === 'https://catalog.example.com/own.json' ? {
        status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Own library', icons: [{ name: 'Own icon', url: 'https://images.example.com/own.svg' }] }),
      } : { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16"/></svg>' })
    })
    await page.route('**/api/**', route => {
      const request = route.request(), pathname = new URL(request.url()).pathname
      const send = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
      if (pathname === '/api/me') return send({ authed, github: true, site_name: 'Guide', public_page: true })
      if (pathname === '/api/settings') {
        if (request.method() === 'GET') return send({ icon_libraries: JSON.stringify(config) })
        config = JSON.parse(request.postDataJSON().icon_libraries); return send({ ok: true })
      }
      if (pathname === '/api/services') return send([service])
      if (pathname === '/api/services/1' && request.method() === 'PUT') {
        service = { ...service, ...request.postDataJSON() }; return send({ ok: true })
      }
      if (pathname === '/api/services/discover-icon') return send({ icons: [{ url: 'https://images.example.com/favicon.ico', name: 'favicon.ico' }] })
      throw new Error(`Unexpected API ${pathname}`)
    })
    await page.goto(base + '/admin/')
    const oauth = page.getByRole('link', { name: '使用 GitHub 登录', exact: true })
    await oauth.waitFor()
    assert.equal(await oauth.getAttribute('href'), '/api/auth/github')
    assert.equal(await oauth.locator('svg,img').count(), 0, 'OAuth entry must use text without a brand graphic')
    authed = true
    await page.goto(base + '/admin/services')
    const edit = () => page.getByRole('button', { name: '编辑 Own service', exact: true }).click()
    const form = () => page.getByRole('dialog', { name: '编辑服务', exact: true })
    const picker = () => page.getByRole('dialog', { name: '选择图标', exact: true })
    const open = () => form().getByRole('button', { name: '选择图标', exact: true }).click()
    await edit(); await open()
    await picker().getByText('还没有图标库，请先添加来源。', { exact: true }).waitFor()
    assert.deepEqual(external, [], 'empty sources must not fetch a default remote catalog')
    await picker().getByRole('button', { name: '取消', exact: true }).click()
    await form().getByLabel('图标', { exact: true }).fill('https://images.example.com/manual.svg')
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    await page.locator('[data-service-id="1"] img').waitFor()
    assert.equal(service.icon, 'https://images.example.com/manual.svg')
    await edit()
    await form().getByRole('button', { name: '获取网站图标', exact: true }).click()
    await page.locator('[data-discovered-icon]').filter({ hasText: 'favicon.ico' }).click()
    await page.getByRole('button', { name: '使用此图标', exact: true }).click()
    assert.equal(await form().getByLabel('图标', { exact: true }).inputValue(), 'https://images.example.com/favicon.ico')
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    await page.reload(); await edit(); await open()
    await picker().getByText('还没有图标库，请先添加来源。', { exact: true }).waitFor()
    await picker().getByRole('button', { name: '管理', exact: true }).click()
    const manager = page.getByRole('dialog', { name: '管理图标库', exact: true })
    await manager.getByRole('button', { name: '添加图标库', exact: true }).click()
    await manager.getByLabel('名称', { exact: true }).fill('Own library')
    await manager.getByLabel('HTTPS JSON 地址', { exact: true }).fill('https://catalog.example.com/own.json')
    await manager.getByRole('button', { name: '保存图标库', exact: true }).click()
    await manager.waitFor({ state: 'hidden' })
    await picker().getByRole('button', { name: 'Own icon', exact: true }).click()
    await picker().getByRole('button', { name: '使用此图标', exact: true }).click()
    assert.equal(await form().getByLabel('图标', { exact: true }).inputValue(), 'https://images.example.com/own.svg')
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    await page.reload(); await edit(); await open()
    await picker().getByRole('button', { name: 'Own icon', exact: true }).waitFor()
    assert.equal(await picker().getByRole('combobox', { name: '图标库', exact: true }).innerText(), 'Own library')
    assert.equal(config.libraries[0].url, 'https://catalog.example.com/own.json')
    assert.deepEqual(errors, [])
    console.log('PASS: text OAuth link; empty picker/reload/no remote source; manual URL/favicon; custom library add/select/reload. Fixture boundaries only, no live Hub.')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
