const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(5000)
  // A Hub reached over plain HTTP has no randomUUID; localhost would hide this.
  await page.addInitScript(() => Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }))
  const errors = [], writes = [], requests = []
  page.on('pageerror', error => errors.push(error.message))
  let config = { activeId: 'one', libraries: [{ id: 'one', name: '第一库', url: 'https://catalog.example.com/one.json' }] }
  let failSettings = false, failSave = false, mode = 'valid'
  const base = { url: 'https://service.example.com', description: '', sort: 0, public: true, enabled: true, checkEnabled: true, createdAt: 1, updatedAt: 2, status: 'unknown', responseMs: null, checkedAt: null }
  let services = [
    {...base,id:1,name:'Emby',category:'影音',icon:'https://images.example.com/ok.svg'},
    {...base,id:2,name:'GitHub',category:'影音',icon:'https://images.example.com/broken.png',public:false},
    {...base,id:3,name:'Tools',category:'开发工具',icon:null,enabled:false},
  ]
  await page.route('https://**/*', async route => {
    const url = route.request().url()
    requests.push(url)
    if (url.includes('catalog.example.com/')) {
      if (mode === 'network') return route.abort('failed')
      if (mode === 'invalid') return route.fulfill({status:200,contentType:'application/json',body:'not JSON'})
      if (mode === 'incompatible') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[]})})
      const suffix = url.includes('one.json') ? 'One' : 'Two'
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({name:suffix,icons:[{name:`${suffix} Icon`,url:`https://images.example.com/${suffix}.svg`}]})})
    }
    return route.fulfill(url.endsWith('broken.png') ? {status:404,body:''} : {status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="blue"/></svg>'})
  })
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    const send = value => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)})
    if (path === '/api/me') return send({authed:true,github:false,site_name:'Navigation',public_page:true})
    if (path === '/api/settings') {
      if (request.method() === 'GET') return failSettings ? route.fulfill({status:503,contentType:'text/plain',body:'配置暂不可用'}) : send({icon_libraries:JSON.stringify(config)})
      if (failSave) return route.fulfill({status:400,contentType:'text/plain',body:'保存被拒绝'})
      const patch = request.postDataJSON()
      assert.deepEqual(Object.keys(patch),['icon_libraries'])
      config = JSON.parse(patch.icon_libraries)
      writes.push({path,body:config})
      return send({ok:true})
    }
    if (path === '/api/services' && request.method() === 'GET') return send(services)
    if (path.startsWith('/api/services')) {
      const body = request.postDataJSON()
      writes.push({path,body})
      const id = Number(path.split('/').at(-1))
      if (request.method() === 'POST') services.push({...base,...body,id:4})
      else services = services.map(service => service.id === id ? {...service,...body} : service)
      return send({ok:true})
    }
    throw new Error(`Unexpected API ${path}`)
  })
  const form = () => page.getByRole('dialog',{name:'编辑服务',exact:true})
  const picker = () => page.getByRole('dialog',{name:'选择图标',exact:true})
  const manager = () => page.getByRole('dialog',{name:'管理图标库',exact:true})
  const edit = () => page.getByRole('button',{name:'编辑 Emby',exact:true}).click()
  const openPicker = () => form().getByRole('button',{name:'选择图标',exact:true}).click()
  const manage = () => picker().getByRole('button',{name:'管理',exact:true}).click()
  const saveManager = async () => { await manager().getByRole('button',{name:'保存图标库',exact:true}).click(); await manager().waitFor({state:'hidden'}) }
  const saveForm = async () => { await form().getByRole('button',{name:'保存',exact:true}).click(); await form().waitFor({state:'hidden'}) }
  const chooseSource = async name => { await picker().getByRole('combobox',{name:'图标库',exact:true}).click(); await page.getByRole('option',{name,exact:true}).click() }
  try {
    await page.goto((process.env.SERVICE_ADMIN_PREVIEW || 'http://127.0.0.1:5200') + '/admin/services')
    const row = id => page.locator(`[data-service-id="${id}"]`)
    await row(1).locator('[data-service-icon]').waitFor()
    await row(2).locator('[data-service-icon-fallback]').waitFor()
    await row(3).locator('[data-service-icon-fallback]').waitFor()
    assert.doesNotMatch(await page.getByRole('table').innerText(),/images\.example|图标：/)
    await edit()
    assert.equal(await form().getByRole('combobox',{name:'分类',exact:true}).innerText(),'影音')
    await form().getByRole('combobox',{name:'分类',exact:true}).click()
    assert.equal(await page.getByRole('option',{name:'影音',exact:true}).count(),1)
    await page.getByRole('textbox',{name:'搜索已有分类',exact:true}).fill('开发')
    await page.getByRole('option',{name:'开发工具',exact:true}).click()
    await saveForm()
    assert.equal(writes.at(-1).body.category,'开发工具')
    await edit()
    await form().getByRole('combobox',{name:'分类',exact:true}).click()
    await page.getByRole('button',{name:'新建分类',exact:true}).click()
    await page.getByRole('textbox',{name:'新分类名称',exact:true}).fill('   ')
    await page.getByRole('button',{name:'创建并选择',exact:true}).click()
    await page.getByRole('alert').filter({hasText:'请填写新分类名称'}).waitFor()
    await page.getByRole('textbox',{name:'新分类名称',exact:true}).fill(' 自建服务 ')
    const before = writes.length
    await page.getByRole('button',{name:'创建并选择',exact:true}).click()
    assert.equal(writes.length,before,'creating a category must not write before saving service')
    await saveForm()
    assert.equal(writes.at(-1).body.category,'自建服务')
    await page.getByRole('button',{name:'添加服务',exact:true}).click()
    const add = page.getByRole('dialog',{name:'添加服务',exact:true})
    await add.getByRole('combobox',{name:'分类',exact:true}).click()
    await page.getByRole('option',{name:'自建服务',exact:true}).waitFor()
    await page.getByRole('option',{name:'未分类',exact:true}).click()
    await add.getByLabel('名称',{exact:true}).fill('New')
    await add.getByLabel('URL',{exact:true}).fill('https://new.example.com')
    await add.getByRole('button',{name:'保存',exact:true}).click()
    await add.waitFor({state:'hidden'})
    assert.equal(writes.at(-1).body.category,'')
    await edit()
    await openPicker()
    await picker().getByRole('button',{name:'One Icon',exact:true}).waitFor()
    assert.equal(requests.filter(url=>url.endsWith('one.json')).length,1)
    await manage()
    await manager().getByRole('button',{name:'添加图标库',exact:true}).click()
    const second = manager().locator('[data-library-editor]').nth(1)
    await second.getByLabel('名称',{exact:true}).fill('第二库')
    await second.getByLabel('HTTPS JSON 地址',{exact:true}).fill('http://catalog.example.com/two.json')
    const beforeInvalid = writes.length
    await manager().getByRole('button',{name:'保存图标库',exact:true}).click()
    await manager().getByRole('alert').filter({hasText:'HTTPS'}).waitFor()
    assert.equal(writes.length,beforeInvalid)
    await second.getByLabel('HTTPS JSON 地址',{exact:true}).fill('https://catalog.example.com/two.json')
    failSave = true
    await manager().getByRole('button',{name:'保存图标库',exact:true}).click()
    await manager().getByRole('alert').filter({hasText:'保存被拒绝'}).waitFor()
    failSave = false
    await saveManager()
    assert.equal(config.libraries.length,2)
    await picker().getByLabel('搜索图标',{exact:true}).fill('nothing')
    await chooseSource('第二库')
    await picker().getByRole('button',{name:'Two Icon',exact:true}).waitFor()
    assert.equal(config.activeId,config.libraries[1].id)
    assert.equal(await picker().getByLabel('搜索图标',{exact:true}).inputValue(),'')
    assert.equal(await picker().getByRole('button',{name:'使用此图标',exact:true}).isDisabled(),true)
    await picker().getByRole('button',{name:'Two Icon',exact:true}).click()
    await picker().getByRole('button',{name:'使用此图标',exact:true}).click()
    assert.equal(await form().getByLabel('图标',{exact:true}).inputValue(),'https://images.example.com/Two.svg')
    await saveForm()
    assert.equal(writes.at(-1).body.icon,'https://images.example.com/Two.svg')
    assert.equal(Object.hasOwn(writes.at(-1).body,'libraries'),false)
    await page.reload()
    await edit(); await openPicker()
    await picker().getByRole('button',{name:'Two Icon',exact:true}).waitFor()
    assert.equal(await picker().getByRole('combobox',{name:'图标库',exact:true}).innerText(),'第二库')
    await manage()
    await manager().locator('[data-library-editor]').nth(1).getByLabel('名称',{exact:true}).fill('改名库')
    await manager().locator('[data-library-editor]').nth(1).getByLabel('HTTPS JSON 地址',{exact:true}).fill('https://catalog.example.com/edited.json')
    await saveManager()
    await picker().getByRole('button',{name:'Two Icon',exact:true}).waitFor()
    assert.match(await picker().innerText(),/当前图标库：改名库/)
    await manage()
    await manager().getByRole('button',{name:'删除图标库 第一库',exact:true}).click()
    await saveManager()
    assert.equal(config.libraries.length,1)
    for (const [nextMode,text] of [['invalid','图标库 JSON 无效'],['incompatible','无法识别此图标库格式'],['network','CORS']]) {
      await manage()
      await manager().getByLabel('HTTPS JSON 地址',{exact:true}).fill(`https://catalog.example.com/${nextMode}.json`)
      mode = nextMode
      await saveManager()
      await picker().getByRole('alert').filter({hasText:text}).waitFor()
      mode = 'valid'
      await picker().getByRole('button',{name:'重试',exact:true}).click()
      await picker().getByRole('button',{name:'Two Icon',exact:true}).waitFor()
    }
    await page.evaluate(()=>document.documentElement.classList.add('dark'))
    await page.setViewportSize({width:390,height:844})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false)
    await manage()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false)
    if (process.env.V32_SCREENSHOT) await page.screenshot({path:process.env.V32_SCREENSHOT,fullPage:true})
    await manager().getByRole('button',{name:'删除图标库 改名库',exact:true}).click()
    await saveManager()
    assert.deepEqual(config,{activeId:'',libraries:[]})
    await picker().getByText('还没有图标库，请先添加来源。',{exact:true}).waitFor()
    await picker().getByRole('button',{name:'取消',exact:true}).click()
    await form().getByRole('button',{name:'取消',exact:true}).click()
    await page.reload(); await edit(); await openPicker()
    await picker().getByText('还没有图标库，请先添加来源。',{exact:true}).waitFor()
    await picker().getByRole('button',{name:'取消',exact:true}).click()
    failSettings = true
    await openPicker()
    await picker().getByRole('alert').filter({hasText:'配置暂不可用'}).waitFor()
    failSettings = false
    await picker().getByRole('button',{name:'重试',exact:true}).click()
    await picker().getByText('还没有图标库，请先添加来源。',{exact:true}).waitFor()
    assert.deepEqual(errors,[])
    console.log('PASS v3.2 Chrome: category dedupe/search/select/create/empty/edit; source add/edit/delete/active/reload persistence; HTTPS/invalid JSON/incompatible/network Retry/save errors; search reset/preview/only image URL; list thumbnail/no URL/fallback; dark/mobile. APIs/catalog/images intercepted in test layer, no live Hub or external network.')
  } finally { await browser.close() }
}
main().catch(error=>{console.error(error);process.exitCode=1})
