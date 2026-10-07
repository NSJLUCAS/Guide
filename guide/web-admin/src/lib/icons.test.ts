/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { createIconCatalogLoader, filterIcons, parseIconCatalog, safeIconUrl, validateIconInput } from "./icons.ts"

const fixture = {
  name: "离歌图标包", description: "上游完整结构测试",
  icons: [
    { name: "Emby", url: "https://raw.githubusercontent.com/lige47/QuanX-icon-rule/main/icon/04ProxySoft/emby.png" },
    { name: "GitHub", url: "https://icons.example.com/github.png" },
    { name: "Bad", url: "https://user:pass@icons.example.com/bad.png" },
    { name: "Unsafe", url: "javascript:alert(1)" },
    { name: "", url: "https://icons.example.com/blank.png" },
  ],
}

test("官方结构过滤不安全图标，搜索忽略大小写和两侧空格", () => {
  const icons = parseIconCatalog(fixture)
  assert.equal(icons.length, 2)
  assert.deepEqual(filterIcons(icons, "  eMbY  "), [fixture.icons[0]])
  assert.deepEqual(filterIcons(icons, "missing"), [])
  assert.deepEqual(filterIcons(icons, " "), fixture.icons.slice(0, 2))
  assert.throws(() => parseIconCatalog({ icons: "not an array" }))
  assert.throws(() => parseIconCatalog({ icons: [fixture.icons[2]] }))
})

test("手动HTTPS无凭据URL保留，空值回退，品牌key兼容", () => {
  assert.equal(validateIconInput("  https://icons.example.com/a.png?size=64  "), "https://icons.example.com/a.png?size=64")
  assert.equal(validateIconInput(" "), null)
  assert.equal(validateIconInput("emby"), "emby")
  assert.equal(validateIconInput("GitHub"), "GitHub")
  for (const value of ["http://icons.example.com/a.png", "https://user@icons.example.com/a.png", "//icons.example.com/a.png", "data:image/svg+xml,x", "https:icons.example.com/a.png"]) {
    assert.equal(safeIconUrl(value), null)
    assert.throws(() => validateIconInput(value), /HTTPS/)
  }
})

test("懒加载复用并发请求和成功清单，保存真实清单URL", async () => {
  const original = globalThis.fetch
  let requests = 0
  try {
    globalThis.fetch = async () => { requests++; return Response.json(fixture) }
    const load = createIconCatalogLoader()
    assert.equal(requests, 0, "constructing a loader must not request the catalog")
    const [first, concurrent] = await Promise.all([load("https://custom.example.com/icons.json"), load("https://custom.example.com/icons.json")])
    assert.equal(first, concurrent)
    assert.equal(await load("https://custom.example.com/icons.json"), first)
    assert.equal(requests, 1)
    assert.equal(first[0].url, "https://raw.githubusercontent.com/lige47/QuanX-icon-rule/main/icon/04ProxySoft/emby.png")
  } finally { globalThis.fetch = original }
})

test("失败清空缓存，让Retry重取有效清单", async () => {
  const original = globalThis.fetch
  let requests = 0
  try {
    globalThis.fetch = async () => {
      requests++
      if (requests === 1) return new Response("Unavailable", { status: 503 })
      return Response.json(fixture)
    }
    const load = createIconCatalogLoader()
    await assert.rejects(load("https://custom.example.com/icons.json"))
    assert.deepEqual(await load("https://custom.example.com/icons.json"), fixture.icons.slice(0, 2))
    assert.equal(requests, 2)
  } finally { globalThis.fetch = original }
})

test("任意配置来源独立缓存，JSON格式错误明确拒绝", async () => {
  const original = globalThis.fetch
  const urls: string[] = []
  try {
    globalThis.fetch = async url => { urls.push(String(url)); return Response.json(fixture) }
    const load = createIconCatalogLoader()
    await load("https://one.example.com/icons.json")
    await load("https://two.example.com/icons.json")
    await load("https://one.example.com/icons.json")
    assert.deepEqual(urls, ["https://one.example.com/icons.json", "https://two.example.com/icons.json"])
    assert.throws(() => parseIconCatalog({ items: [] }), /无法识别此图标库格式/)
    assert.throws(() => parseIconCatalog({ icons: [] }), /无法识别此图标库格式/)
    assert.deepEqual(parseIconCatalog({ name: "空库", icons: [] }), [])
    const invalid = createIconCatalogLoader()
    globalThis.fetch = async () => new Response("not JSON", { status: 200 })
    await assert.rejects(invalid("https://invalid.example.com/icons.json"), /JSON/)
    await assert.rejects(load("http://unsafe.example.com/icons.json"), /HTTPS/)
  } finally { globalThis.fetch = original }
})
