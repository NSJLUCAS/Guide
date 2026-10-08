/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { categoriesOf, filterServices, serviceSummary, responseLabel, checkedLabel, serviceHref, serviceDomain, currentService, type Service } from "./services.ts"

const now = Date.parse("2026-10-02T12:00:00Z")
const service = (patch: Partial<Service> = {}): Service => ({
  id: 1, name: "Emby", description: "家庭影音服务", category: "影音娱乐", icon: null,
  url: "https://media.example.com/library", status: "online", responseMs: 86,
  checkedAt: new Date(now - 60_000).toISOString(), ...patch,
})
const services = [service(), service({ id: 2, name: "GitHub", description: "代码托管", category: "开发工具", responseMs: 114 }),
  service({ id: 3, name: "Matrix", category: "", status: "offline", responseMs: 900 }),
  service({ id: 4, name: "SimpleX", description: "私密聊天", category: "开发工具", status: "unknown", responseMs: null, checkedAt: null })]

test("缓存状态随时间过期，关检测和离线不显示响应时间", () => {
  const cached = service({ checkedAt: new Date(now).toISOString() })
  assert.equal(currentService(cached, now + 180_000).status, "online")
  assert.equal(currentService(cached, now + 181_000).status, "unknown")
  assert.equal(currentService(cached, now + 181_000).responseMs, null)
  assert.equal(currentService(service({ checkEnabled: false }), now).status, "unchecked")
  assert.equal(responseLabel(currentService(service({ status: "offline" }), now)), "—")
})

test("缓存的检测受限状态在刷新失败时仍过期，且不计作在线或离线", () => {
  const protectedService = service({ status: "protected", checkedAt: new Date(now).toISOString(), responseMs: 999 })
  assert.equal(currentService(protectedService, now + 180_000).status, "protected")
  assert.equal(currentService(protectedService, now + 181_000).status, "unknown")
  assert.equal(currentService(protectedService, now).responseMs, null)
  assert.equal(currentService({ ...protectedService, checkEnabled: false }, now).status, "unchecked")
  const stats = serviceSummary([service(), protectedService])
  assert.equal(stats.online, 1)
  assert.equal(stats.offline, 0)
  assert.equal(stats.averageMs, 86)
})

test("分类按数据顺序计数，空分类独立展示，空数据不产生分类", () => {
  assert.deepEqual(categoriesOf(services), [{ value: "影音娱乐", label: "影音娱乐", count: 1 }, { value: "开发工具", label: "开发工具", count: 2 }, { value: "", label: "未分类", count: 1 }])
  assert.deepEqual(categoriesOf([]), [])
})

test("管理分类按后台顺序显示空分类，未分类置后，网站排序不影响顺序", () => {
  assert.deepEqual(categoriesOf(services, ["空分类","开发工具","影音娱乐"]), [
    {value:"空分类",label:"空分类",count:0}, {value:"开发工具",label:"开发工具",count:2},
    {value:"影音娱乐",label:"影音娱乐",count:1}, {value:"",label:"未分类",count:1},
  ])
  assert.equal(categoriesOf([...services].reverse(), ["空分类","开发工具","影音娱乐"])[0].value,"空分类")
  assert.deepEqual(categoriesOf([], ["空分类"]), [{value:"空分类",label:"空分类",count:0}])
})
test("名称、简介、域名搜索忽略大小写和首尾空格，并与分类相交", () => {
  assert.deepEqual(filterServices(services, null, "  GITHUB  ").map(s => s.id), [2])
  assert.deepEqual(filterServices(services, "影音娱乐", "家庭").map(s => s.id), [1])
  assert.equal(filterServices(services, "开发工具", "家庭").length, 0)
  assert.equal(filterServices(services, "", "").length, 1)
  assert.equal(filterServices(services, null, "media.example.com").length, 4)
})
test("统计只平均在线有效响应，空集合不伪造 0ms", () => {
  assert.deepEqual(serviceSummary(services), { total: 4, online: 2, offline: 1, unknown: 1, categories: 2, averageMs: 100 })
  assert.equal(serviceSummary([service({ responseMs: NaN }), service({ responseMs: -1 }), service({ status: "offline" })]).averageMs, null)
  assert.equal(serviceSummary([service({ responseMs: 0 })]).averageMs, 0)
  assert.deepEqual(serviceSummary([]), { total: 0, online: 0, offline: 0, unknown: 0, categories: 0, averageMs: null })
})
test("离线、未知与无效响应使用占位，不把失败显示为 0ms", () => {
  assert.equal(responseLabel(service()), "86 ms")
  for (const patch of [{ status: "offline" as const }, { status: "unknown" as const }, { responseMs: null }, { responseMs: Infinity }, { responseMs: -1 }]) {
    assert.equal(responseLabel(service(patch)), "—")
  }
})
test("最近检查支持分钟、小时、天，缺失和坏时间不声称已检查", () => {
  assert.equal(checkedLabel(service().checkedAt, now), "1 分钟前")
  assert.equal(checkedLabel(new Date(now - 5_000).toISOString(), now), "刚刚")
  assert.equal(checkedLabel(new Date(now - 7_200_000).toISOString(), now), "2 小时前")
  assert.equal(checkedLabel(new Date(now - 172_800_000).toISOString(), now), "2 天前")
  assert.equal(checkedLabel(null, now), "尚未检测")
  assert.equal(checkedLabel("invalid", now), "尚未检测")
})
test("访问入口仅允许无凭据 HTTP(S)，域名展示保留端口", () => {
  assert.equal(serviceHref("https://example.com/a?q=1"), "https://example.com/a?q=1")
  assert.equal(serviceDomain("http://localhost:8080/a"), "localhost:8080")
  for (const url of ["javascript:alert(1)", "data:text/html,bad", "https://user:pass@example.com", "invalid"]) {
    assert.equal(serviceHref(url), null)
    assert.equal(serviceDomain(url), "无效地址")
  }
})
