// Built admin + public UI, isolated stateful API fixtures. No production requests.
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const roots = { admin: path.resolve(__dirname, '../../guide/web-admin/dist'), public: path.resolve(__dirname, '../../navigation-theme/dist') }
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname
      const admin = pathname.startsWith('/admin')
      const root = admin ? roots.admin : roots.public
      const asset = admin ? pathname.replace(/^\/admin/, '') : pathname
      const file = path.resolve(root, '.' + (asset.startsWith('/assets/') ? asset : '/index.html'))
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return }
      res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' })
      res.end(await fs.readFile(file))
    } catch { res.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
    await context.addInitScript(() => { if (location.protocol === 'http:') localStorage.setItem('theme', 'light') })
    const errors = []
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
    let categories = [{ id: 1, name: '工具', sort: 0 }, { id: 2, name: '影音', sort: 1 }]
    let next = 3, staleDelete = false, failLoad = false
    const services = [{ id: 1, name: 'Fixture protected', url: 'https://example.com/', description: '', icon: null, category: '工具', sort: 91, public: true, enabled: true, checkEnabled: true, status: 'protected', responseMs: null, checkedAt: new Date().toISOString() }]
    await context.route('**/api/**', async route => {
      const request = route.request(), endpoint = new URL(request.url()).pathname, method = request.method()
      let value, status = 200
      if (endpoint === '/api/me') value = { authed: true, github: false, site_name: 'Guide', public_page: true, site: '' }
      else if (endpoint === '/api/public-config') value = { cardStyle: 'standard' }
      else if (endpoint === '/api/categories' && method === 'GET') {
        if (failLoad) return route.fulfill({ status: 503, contentType: 'text/plain; charset=utf-8', body: '分类暂不可用' })
        value = categories.map(row => ({ ...row, count: services.filter(site => site.category === row.name).length }))
      } else if (endpoint === '/api/categories' && method === 'POST') {
        categories.push({ id: next++, name: request.postDataJSON().name, sort: categories.length }); status = 201; value = { ok: true }
      } else if (endpoint === '/api/categories/order') {
        categories = request.postDataJSON().ids.map((id, sort) => ({ ...categories.find(row => row.id === id), sort })); status = 204
      } else if (/^\/api\/categories\/\d+$/.test(endpoint)) {
        const id = Number(endpoint.split('/').pop()), row = categories.find(row => row.id === id)
        if (method === 'PUT') { const old = row.name; row.name = request.postDataJSON().name; services.filter(site => site.category === old).forEach(site => { site.category = row.name }); status = 204 }
        else if (staleDelete || services.some(site => site.category === row.name)) return route.fulfill({ status: 400, contentType: 'text/plain; charset=utf-8', body: '该分类仍有关联网站，请先迁移关联网站后再删除' })
        else { categories = categories.filter(row => row.id !== id); status = 204 }
      } else if (endpoint === '/api/services') value = services
      else if (/^\/api\/services\/\d+$/.test(endpoint) && method === 'PUT') { Object.assign(services[0], request.postDataJSON()); status = 204 }
      else return route.fulfill({ status: 404, body: '' })
      return route.fulfill({ status, ...(status === 204 ? {} : { contentType: 'application/json', body: JSON.stringify(value) }) })
    })
    const base = `http://127.0.0.1:${server.address().port}`
    const admin = await context.newPage(), publicPage = await context.newPage()
    await admin.goto(base + '/admin/categories')
    const table = admin.getByRole('table', { name: '分类列表' })
    await table.getByText('工具', { exact: true }).waitFor()
    await publicPage.goto(base)
    const group = publicPage.getByRole('group', { name: '网站分类' })
    const labels = () => group.getByRole('button').evaluateAll(buttons => buttons.map(button => button.firstChild.textContent))
    await group.getByRole('button', { name: /^工具/ }).waitFor(); assert.deepEqual(await labels(), ['全部', '工具', '影音'])
    assert.equal(await group.getByRole('button', { name: /^全部/ }).getAttribute('aria-pressed'), 'true')
    await publicPage.locator('[data-service-id="1"]').getByText('检测受限', { exact: true }).waitFor()
    await admin.getByRole('button', { name: '新增分类', exact: true }).click()
    await admin.getByLabel('分类名称', { exact: true }).fill('空分类')
    await admin.getByRole('button', { name: '保存', exact: true }).click()
    await table.getByText('空分类', { exact: true }).waitFor()
    await group.getByRole('button', { name: /^空分类/ }).waitFor()
    await admin.getByRole('button', { name: '上移分类 空分类', exact: true }).click()
    await admin.waitForFunction(() => document.querySelectorAll('[data-category-id]')[1]?.textContent.includes('空分类'))
    await publicPage.waitForFunction(() => [...document.querySelectorAll('[aria-label="网站分类"] button')].map(button => button.firstChild.textContent).join() === '全部,工具,空分类,影音')
    assert.deepEqual(await labels(), ['全部', '工具', '空分类', '影音'])
    await admin.getByRole('button', { name: '下移分类 空分类', exact: true }).click()
    await publicPage.waitForFunction(() => [...document.querySelectorAll('[aria-label="网站分类"] button')].map(button => button.firstChild.textContent).join() === '全部,工具,影音,空分类')
    await admin.getByRole('button', { name: '上移分类 空分类', exact: true }).click()
    await publicPage.waitForFunction(() => [...document.querySelectorAll('[aria-label="网站分类"] button')].map(button => button.firstChild.textContent).join() === '全部,工具,空分类,影音')
    await group.getByRole('button', { name: /^空分类/ }).click()
    await publicPage.getByText('没有匹配的网站', { exact: true }).waitFor()
    await group.getByRole('button', { name: /^全部/ }).click()
    await admin.getByRole('button', { name: '编辑分类 工具', exact: true }).click()
    await admin.getByLabel('分类名称', { exact: true }).fill('新工具')
    await admin.getByRole('button', { name: '保存', exact: true }).click()
    await table.getByText('新工具', { exact: true }).waitFor()
    await group.getByRole('button', { name: /^新工具/ }).waitFor()
    await publicPage.locator('[data-service-id="1"]').getByText('检测受限', { exact: true }).waitFor()
    await admin.getByRole('button', { name: '删除分类 新工具', exact: true }).click()
    await admin.getByText(/关联 1 个网站，请先/).waitFor()
    assert.equal(await admin.getByRole('button', { name: '确认删除', exact: true }).isDisabled(), true)
    await admin.getByRole('button', { name: '取消', exact: true }).click()
    // A zero-count snapshot must still display the backend's refusal after a race.
    staleDelete = true
    await admin.getByRole('button', { name: '删除分类 空分类', exact: true }).click()
    await admin.getByRole('button', { name: '确认删除', exact: true }).click()
    await admin.getByRole('alert').filter({ hasText: '先迁移' }).waitFor()
    staleDelete = false
    await admin.getByRole('button', { name: '取消', exact: true }).click()
    await admin.getByRole('button', { name: '删除分类 空分类', exact: true }).click()
    await admin.getByRole('button', { name: '确认删除', exact: true }).click()
    await admin.waitForFunction(() => !document.querySelector('[data-category-id="3"]'))
    await publicPage.waitForFunction(() => !document.querySelector('[aria-label="网站分类"]')?.textContent.includes('空分类'))
    await admin.getByRole('button', { name: '服务', exact: true }).click()
    await admin.getByRole('button', { name: '编辑 Fixture protected', exact: true }).click()
    await admin.getByRole('combobox').click()
    assert.deepEqual(await admin.getByRole('option').allTextContents(), ['未分类', '新工具', '影音'])
    await admin.getByRole('option', { name: '影音', exact: true }).click()
    await admin.getByRole('button', { name: '保存', exact: true }).click()
    await admin.locator('[data-service-id="1"]').getByText('影音', { exact: true }).waitFor()
    await admin.getByRole('button', { name: '分类', exact: true }).click()
    await table.getByText('新工具', { exact: true }).waitFor()
    assert.equal(services[0].sort, 91)
    assert.equal(await table.locator('[data-category-id="1"]').locator('td').nth(1).innerText(), '0')
    await admin.getByRole('button', { name: '删除分类 新工具', exact: true }).click()
    await admin.getByRole('button', { name: '确认删除', exact: true }).click()
    await admin.waitForFunction(() => !document.querySelector('[data-category-id="1"]'))
    for (const page of [admin, publicPage]) {
      await page.setViewportSize({ width: 390, height: 844 })
      const toggle = page === admin ? page.getByTitle('切换主题', { exact: true }) : page.getByRole('button', { name: /切换.*色/ })
      await toggle.click()
      assert.equal(await page.locator('html').evaluate(element => element.classList.contains('dark')), true)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      if (process.env.GUIDE_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.GUIDE_SCREENSHOT_DIR, page === admin ? 'categories-admin-mobile.png' : 'categories-public-mobile.png'), fullPage: true })
    }
    failLoad = true
    await admin.getByRole('button', { name: '刷新列表', exact: true }).click()
    await admin.getByRole('alert').filter({ hasText: '分类暂不可用' }).waitFor()
    assert.equal(await admin.getByRole('button', { name: '新增分类', exact: true }).isDisabled(), true)
    failLoad = false
    await admin.getByRole('button', { name: '重试', exact: true }).click()
    await table.getByText('影音', { exact: true }).waitFor()
    assert.deepEqual(errors, [])
    console.log('PASS: category CRUD, counts, arrows, live public order/all/empty, occupied/stale deletion guards, service picker/migration, protected retained, error retry, dark/mobile/no overflow.')
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
