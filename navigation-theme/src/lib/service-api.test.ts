/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { getServices, servicesFromApi } from "./service-api.ts"
import { categoriesOf, filterServices, serviceSummary, responseLabel, checkedLabel } from "./services.ts"

const bilibili = {
  id: 1, name: "B站", url: "https://t.bilibili.com/", description: "", icon: null,
  category: "影音娱乐", public: true, enabled: true, sort: 0,
  status: "unknown", responseMs: null, checkedAt: null,
}

test("真实 B站 Service 转换驱动分类、搜索和统计，未知响应不伪造 0ms", () => {
  const services = servicesFromApi([bilibili])
  assert.deepEqual(categoriesOf(services), [{ value: "影音娱乐", label: "影音娱乐", count: 1 }])
  assert.equal(filterServices(services, "影音娱乐", "bilibili.com")[0].name, "B站")
  assert.deepEqual(serviceSummary(services), { total: 1, online: 0, offline: 0, unknown: 1, categories: 1, averageMs: null })
  assert.equal(responseLabel(services[0]), "—")
  assert.equal(checkedLabel(services[0].checkedAt, Date.now()), "尚未检测")
  assert.deepEqual(servicesFromApi([]), [])
  assert.throws(() => servicesFromApi({}), /数据格式/)
})

test("生产 client 请求现有 /api/services，并传播加载错误用于重试", async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  globalThis.fetch = async (input, init) => {
    calls.push(String(input))
    assert.equal(init?.cache, "no-store")
    return Response.json([bilibili])
  }
  try {
    assert.equal((await getServices())[0].name, "B站")
    assert.deepEqual(calls, ["/api/services"])
    globalThis.fetch = async () => new Response("暂时不可用", { status: 503 })
    await assert.rejects(getServices(), /暂时不可用/)
    globalThis.fetch = async () => Response.json([])
    assert.deepEqual(await getServices(), [])
  } finally { globalThis.fetch = original }
})

test("真实状态保留未检测，过期/缺时间/未来时间不冒充在线", () => {
  const now = Date.parse("2026-10-03T12:00:00Z")
  const online = { ...bilibili, status: "online", responseMs: 86, checkedAt: new Date(now - 60_000).toISOString() }
  assert.equal(servicesFromApi([online], now)[0].status, "online")
  const unchecked = servicesFromApi([{ ...online, checkEnabled: false }], now)[0]
  assert.equal(unchecked.status, "unchecked")
  assert.equal(unchecked.responseMs, null)
  for (const checkedAt of [null, new Date(now - 181_000).toISOString(), new Date(now + 1000).toISOString()]) {
    const stale = servicesFromApi([{ ...online, checkedAt }], now)[0]
    assert.equal(stale.status, "unknown")
    assert.equal(stale.responseMs, null)
  }
  assert.equal(servicesFromApi([{ ...online, checkedAt: new Date(now - 180_000).toISOString() }], now)[0].status, "online")
  assert.equal(servicesFromApi([{ ...online, status: "offline" }], now)[0].responseMs, null)
})

test("检测受限兼容旧状态，保留检查时间并按原规则过期", () => {
  const now = Date.parse("2026-10-08T12:00:00Z")
  const row = { ...bilibili, status: "protected", responseMs: 999, checkedAt: new Date(now).toISOString() }
  const fresh = servicesFromApi([row], now)[0]
  assert.equal(fresh.status, "protected")
  assert.equal(fresh.responseMs, null)
  assert.equal(fresh.checkedAt, row.checkedAt)
  assert.equal(responseLabel(fresh), "—")
  assert.equal(servicesFromApi([row], now + 180_000)[0].status, "protected")
  for (const checkedAt of [null, "invalid", new Date(now - 181_000).toISOString(), new Date(now + 1000).toISOString()]) {
    assert.equal(servicesFromApi([{ ...row, checkedAt }], now)[0].status, "unknown")
  }
  assert.equal(servicesFromApi([row], now + 181_000)[0].status, "unknown")
  assert.equal(servicesFromApi([{ ...row, checkEnabled: false }], now)[0].status, "unchecked")
  for (const status of ["online", "offline", "unknown", "unchecked", "future-status"]) {
    assert.equal(servicesFromApi([{ ...row, status }], now)[0].status, status === "future-status" ? "unknown" : status)
  }
})
