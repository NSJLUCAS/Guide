const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const base = process.env.SERVICE_ADMIN_PREVIEW
  assert.ok(base, 'SERVICE_ADMIN_PREVIEW must point at a local admin preview')
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  const page = await browser.newPage()
  const errors = [], writes = []
  page.on('pageerror', error => errors.push(error.message))
  let mode = 'rename', reads = 0
  const service = { id: 1, name: 'Snapshot', url: 'https://example.com/', description: '', icon: null,
    category: '新分类', sort: 0, public: true, enabled: true, checkEnabled: true,
    createdAt: 1, updatedAt: 1, status: 'protected', responseMs: null, checkedAt: null }
  await page.route('https://**/*', route => route.fulfill({ status: 404, body: '' }))
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    const send = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) })
    if (path === '/api/me') return send({ authed: true, github: false, site_name: 'Guide', public_page: true })
    if (path === '/api/services' && request.method() === 'GET') {
      reads++
      return send([{ ...service, category: mode === 'persistent' || (mode === 'rename' && reads === 1) ? '旧分类' : service.category }])
    }
    if (path === '/api/categories') {
      if (mode === 'legacy') return route.fulfill({ status: 404, body: '' })
      return send([{ id: 1, name: '新分类', sort: 0, count: 1 }])
    }
    if (path === '/api/services/1') {
      writes.push(request.postDataJSON())
      return send({ ...service, ...writes.at(-1) })
    }
    throw new Error(`Unexpected API ${path}`)
  })
  try {
    await page.goto(base + '/admin/services')
    const edit = page.getByRole('button', { name: '编辑 Snapshot', exact: true })
    await edit.waitFor()
    assert.equal(await page.locator('[data-service-id="1"]').getByText('新分类', { exact: true }).count(), 1,
      'A renamed category must be reread before the service becomes editable')
    await edit.click()
    const form = page.getByRole('dialog', { name: '编辑服务', exact: true })
    await form.getByLabel('简介', { exact: true }).fill('changed')
    await form.getByRole('button', { name: '保存', exact: true }).click()
    await form.waitFor({ state: 'hidden' })
    assert.equal(writes[0].category, '新分类', 'An unrelated edit must not recreate the old category')
    mode = 'persistent'; reads = 0
    await page.reload()
    await page.getByRole('alert').filter({ hasText: '分类已发生变化' }).waitFor()
    assert.ok(reads > 1 && reads <= 3, 'Inconsistent snapshots must retry with a bound')
    assert.equal(await page.getByRole('button', { name: '添加服务', exact: true }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: '编辑 Snapshot', exact: true }).count(), 0)
    mode = 'valid'
    await page.getByRole('button', { name: '重试', exact: true }).click()
    await edit.waitFor(); assert.equal(await edit.isDisabled(), false)
    mode = 'legacy'
    await page.reload(); await edit.waitFor(); assert.equal(await edit.isDisabled(), false)
    assert.deepEqual(errors, [])
    console.log('PASS admin category snapshots: rename retry, safe edit, bounded mismatch lock, retry recovery, legacy 404')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
