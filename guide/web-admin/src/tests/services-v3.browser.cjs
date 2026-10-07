const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(4000)
  const runtimeErrors = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  const selectedUrl = 'https://raw.githubusercontent.com/lige47/QuanX-icon-rule/main/icon/04ProxySoft/emby.png'
  const fixture = { name: '离歌图标包', description: '官方结构测试fixture', icons: [
    { name: 'Emby', url: selectedUrl },
    { name: 'Broken', url: 'https://icons.example.com/broken.png' },
    ...Array.from({ length: 99 }, (_, i) => ({ name: `Catalog ${i}`, url: `https://icons.example.com/${i}.png` })),
    { name: 'Unsafe', url: 'https://user:pass@icons.example.com/unsafe.png' },
  ] }
  let catalogRequests = 0
  let failCatalog = true
  let services = [{ id: 1, name: 'Emby', url: 'https://media.example.com', description: '', icon: 'emby', category: '', sort: 0, enabled: true, public: true, createdAt: 1, updatedAt: 2, status: 'unknown', responseMs: null, checkedAt: null }]
  let settings = { icon_libraries: JSON.stringify({ activeId: 'fixture', libraries: [{ id: 'fixture', name: '离歌图标库', url: 'https://raw.githubusercontent.com/lige47/lige_icon/main/ligeicon.json' }] }) }
  const writes = []
  // All external images and GitHub traffic are intercepted in the test layer.
  await page.route('https://**/*', async route => {
    if (route.request().url() === 'https://raw.githubusercontent.com/lige47/lige_icon/main/ligeicon.json') {
      catalogRequests++
      return route.fulfill(failCatalog ? { status: 503, body: 'Unavailable' } : { status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
    }
    return route.fulfill({ status: 404, body: '' })
  })
  await page.route('**/api/**', async route => {
    const request = route.request(), pathname = new URL(request.url()).pathname
    const send = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) })
    if (pathname === '/api/me') return send({ authed: true, github: false, site_name: 'Guide', public_page: true, site: 'https://guide.example.com' })
    if (pathname === '/api/settings') { if (request.method() === 'PUT') settings = { ...settings, ...request.postDataJSON() }; return send(settings) }
    if (pathname === '/api/services' && request.method() === 'GET') return send(services)
    if (pathname.startsWith('/api/services')) {
      const body = request.postDataJSON()
      writes.push({ method: request.method(), body })
      assert.equal(typeof body.checkEnabled, 'boolean')
      assert.equal(Object.hasOwn(body, 'check_enabled'), false)
      if (request.method() === 'POST') services.push({ ...services[0], ...body, id: services.length + 1 })
      else services[0] = { ...services[0], ...body }
      return send(services.at(-1))
    }
    return send({})
  })
  const edit = () => page.getByRole('button', { name: '编辑 Emby', exact: true }).click()
  const form = () => page.getByRole('dialog', { name: '编辑服务', exact: true })
  const picker = () => page.getByRole('dialog', { name: '选择图标', exact: true })
  try {
    await page.goto((process.env.SERVICE_ADMIN_PREVIEW || 'http://127.0.0.1:5194') + '/admin/services')
    await edit()
    assert.equal(await form().getByRole('switch', { name: '在线检测', exact: true }).getAttribute('aria-checked'), 'true', 'old fixtures default to checking')
    assert.equal(catalogRequests, 0, 'opening a Service form must not load the catalog')
    await form().getByRole('button', { name: '选择图标', exact: true }).click()
    await picker().getByRole('alert').waitFor()
    await picker().getByRole('button', { name: '取消', exact: true }).click()
    assert.equal(await form().getByLabel('图标', { exact: true }).inputValue(), 'emby')
    await form().getByRole('switch', { name: '在线检测', exact: true }).click()
    await form().getByLabel('图标', { exact: true }).fill(' https://manual.example.com/icon.png ')
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    assert.equal(writes.at(-1).body.icon, 'https://manual.example.com/icon.png')
    assert.equal(writes.at(-1).body.checkEnabled, false, 'catalog failure must not block manual input or saving')

    await edit()
    assert.equal(await form().getByRole('switch', { name: '在线检测', exact: true }).getAttribute('aria-checked'), 'false')
    await form().getByRole('button', { name: '选择图标', exact: true }).click()
    await picker().getByRole('alert').waitFor()
    failCatalog = false
    await picker().getByRole('button', { name: '重试', exact: true }).click()
    await picker().getByRole('button', { name: 'Emby', exact: true }).waitFor()
    assert.equal(catalogRequests, 3)
    assert.equal(await picker().locator('[data-catalog-icon]').count(), 80)
    await picker().getByRole('button', { name: '加载更多', exact: true }).click()
    assert.equal(await picker().locator('[data-catalog-icon]').count(), 101)
    await picker().getByLabel('搜索图标', { exact: true }).fill(' missing ')
    await picker().getByText('没有找到匹配的图标', { exact: true }).waitFor()
    await picker().getByLabel('搜索图标', { exact: true }).fill(' eMbY ')
    assert.equal(await picker().locator('[data-catalog-icon]').count(), 1)
    await picker().getByRole('button', { name: 'Emby', exact: true }).click()
    assert.equal(await picker().getByRole('button', { name: '使用此图标', exact: true }).isEnabled(), true)
    await picker().getByRole('button', { name: '取消', exact: true }).click()
    assert.equal(await form().getByLabel('图标', { exact: true }).inputValue(), 'https://manual.example.com/icon.png', 'cancel must not apply selection')
    await form().getByRole('button', { name: '选择图标', exact: true }).click()
    await picker().getByLabel('搜索图标', { exact: true }).fill('Broken')
    await picker().getByRole('button', { name: 'Broken', exact: true }).click()
    await picker().getByRole('img', { name: '图标不可用', exact: true }).first().waitFor()
    await picker().getByLabel('搜索图标', { exact: true }).fill('Emby')
    await picker().getByRole('button', { name: 'Emby', exact: true }).click()
    await picker().getByRole('button', { name: '使用此图标', exact: true }).click()
    assert.equal(await form().getByLabel('图标', { exact: true }).inputValue(), selectedUrl)
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    assert.equal(writes.at(-1).body.icon, selectedUrl, 'store URL provided by catalog')
    assert.equal(catalogRequests, 3, 'successful cache survives picker and Service form remounts')

    await edit()
    await form().getByRole('button', { name: '选择图标', exact: true }).click()
    await picker().getByRole('button', { name: 'Emby', exact: true }).waitFor()
    assert.equal(catalogRequests, 3)
    await picker().getByRole('button', { name: '取消', exact: true }).click()
    const before = writes.length
    for (const invalid of ['http://manual.example.com/icon.png', 'https://user:pass@manual.example.com/icon.png']) {
      await form().getByLabel('图标', { exact: true }).fill(invalid)
      await form().getByRole('button', { name: '保存', exact: true }).click()
      await form().getByRole('alert').waitFor()
      assert.equal(writes.length, before)
    }
    await form().getByLabel('图标', { exact: true }).fill('github')
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    assert.equal(writes.at(-1).body.icon, 'github')
    await edit()
    await form().getByLabel('图标', { exact: true }).fill('')
    await form().getByRole('button', { name: '保存', exact: true }).click()
    await form().waitFor({ state: 'hidden' })
    assert.equal(writes.at(-1).body.icon, null)

    await page.getByRole('button', { name: '添加服务', exact: true }).click()
    const addForm = page.getByRole('dialog', { name: '添加服务', exact: true })
    assert.equal(await addForm.getByRole('switch', { name: '在线检测', exact: true }).getAttribute('aria-checked'), 'true')
    await addForm.getByLabel('名称', { exact: true }).fill('New')
    await addForm.getByLabel('URL', { exact: true }).fill('https://new.example.com')
    await addForm.getByRole('button', { name: '保存', exact: true }).click()
    await addForm.waitFor({ state: 'hidden' })
    assert.equal(writes.at(-1).method, 'POST')
    assert.equal(writes.at(-1).body.checkEnabled, true)

    await page.setViewportSize({ width: 390, height: 844 })
    await edit()
    await form().getByRole('button', { name: '选择图标', exact: true }).click()
    await picker().getByRole('button', { name: 'Emby', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await picker().getByRole('button', { name: '取消', exact: true }).click()
    assert.equal(await picker().count(), 0)
    assert.equal(await form().count(), 1)
    assert.deepEqual(runtimeErrors, [])
    console.log('PASS: Chrome real Service dialogs, old/new checking defaults, checkEnabled requests, lazy external catalog, failure/manual save/Retry, pagination/search/no results, cancel/confirmation URL, cache across forms, image fallback, HTTPS validation, legacy key/empty, mobile overflow. All API/catalog/images mocked in test layer.')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
