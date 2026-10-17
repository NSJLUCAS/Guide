import assert from "node:assert/strict"
import { test } from "node:test"
import { eachLimited, knownLinks, linkHost, looksLikeLinks, normalizeLink, parsePastedLinks } from "./bulk-paste.ts"

test("浏览器复制的多行网址逐行识别，重复只留一个", () => {
  const text = "https://www.ea.com/ea-sports-fc/ultimate-team/web-app/\r\nhttps://www.fut.gg/\n\n  https://www.futbin.com  \nhttps://www.fut.gg/"
  assert.deepEqual(parsePastedLinks(text), { links: [
    { url: "https://www.ea.com/ea-sports-fc/ultimate-team/web-app/", title: "" },
    { url: "https://www.fut.gg/", title: "" },
    { url: "https://www.futbin.com/", title: "" },
  ], rejected: [] })
})

test("标题加网址和 Markdown 链接都取出标题", () => {
  assert.deepEqual(parsePastedLinks("FUTBIN - https://www.futbin.com/\n[FUT.GG](https://www.fut.gg/)\nEA：https://www.ea.com").links, [
    { url: "https://www.futbin.com/", title: "FUTBIN" },
    { url: "https://www.fut.gg/", title: "FUT.GG" },
    { url: "https://www.ea.com/", title: "EA" },
  ])
})

test("无效行原样退回，不静默丢弃", () => {
  const { links, rejected } = parsePastedLinks("ftp://example.com\nhttps://user:pass@example.com\n随便一段话\nhttps://ok.example")
  assert.deepEqual(links.map(link => link.url), ["https://ok.example/"])
  assert.deepEqual(rejected, ["ftp://example.com", "https://user:pass@example.com", "随便一段话"])
})

test("只有全部是网址时才当作批量粘贴", () => {
  assert.equal(looksLikeLinks("https://a.example\nhttps://b.example"), true)
  assert.equal(looksLikeLinks("https://a.example"), true)
  assert.equal(looksLikeLinks("https://a.example\n备注"), false)
  assert.equal(looksLikeLinks("   "), false)
})

test("名称兜底用去掉 www 的域名，已存在地址按规范化比较", () => {
  assert.equal(linkHost("https://www.fut.gg/"), "fut.gg")
  assert.equal(linkHost("https://futbin.com/players"), "futbin.com")
  assert.equal(normalizeLink("HTTPS://WWW.FUT.GG"), "https://www.fut.gg/")
  assert.equal(normalizeLink("https://@example.com"), null)
  assert.ok(knownLinks([{ url: "https://www.fut.gg" }]).has("https://www.fut.gg/"))
})

test("并发上限内逐个处理全部条目", async () => {
  let running = 0, peak = 0
  const done: number[] = []
  await eachLimited([1, 2, 3, 4, 5, 6, 7], 3, async item => {
    peak = Math.max(peak, ++running)
    await new Promise(resolve => setTimeout(resolve, 5))
    done.push(item)
    running--
  })
  assert.equal(peak, 3)
  assert.deepEqual(done.sort(), [1, 2, 3, 4, 5, 6, 7])
  await eachLimited([], 3, async () => assert.fail("no work"))
})
