/// <reference types="node" />
import assert from "node:assert/strict"
import { serviceApi, serviceValues, moveService, type Service } from "./api.ts"

const service: Service = {
  id: 1, name: "Emby", url: "https://example.com/", description: "影音", icon: "emby",
  category: "", sort: 9, public: false, enabled: true, createdAt: 1, updatedAt: 2,
  status: "unknown", responseMs: null, checkedAt: null,
}
assert.deepEqual(serviceValues(service), {
  name: "Emby", url: "https://example.com/", description: "影音", icon: "emby",
  category: "", sort: 9, public: false, enabled: true, checkEnabled: true,
})
assert.deepEqual(serviceValues(), {
  name: "", url: "", description: "", icon: null, category: "", sort: 0, public: false, enabled: true, checkEnabled: true,
})
assert.equal(serviceValues({ checkEnabled: false }).checkEnabled, false)
assert.equal(serviceValues({ checkEnabled: true }).checkEnabled, true)
const items = [service, { ...service, id: 2 }, { ...service, id: 3 }]
assert.deepEqual(moveService(items, 1, -1).map(s => s.id), [2, 1, 3])
assert.deepEqual(moveService(items, 1, 1).map(s => s.id), [1, 3, 2])
assert.deepEqual(moveService(items, 0, -1).map(s => s.id), [1, 2, 3])
assert.deepEqual(items.map(s => s.id), [1, 2, 3], "source order must not mutate")

const calls: { url: string; method: string; body: unknown }[] = []
const originalFetch = globalThis.fetch
try {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null })
    return Response.json(init?.method ? service : [service])
  }
  assert.deepEqual(await serviceApi.list(), [service])
  await serviceApi.create(serviceValues(service))
  await serviceApi.update(1, serviceValues(service))
  await serviceApi.remove(1)
  await serviceApi.order([3, 2, 1])
  assert.deepEqual(calls.map(c => [c.url, c.method]), [
    ["/api/services", "GET"], ["/api/services", "POST"], ["/api/services/1", "PUT"],
    ["/api/services/1", "DELETE"], ["/api/services/order", "PUT"],
  ])
  assert.deepEqual(calls[1].body, serviceValues(service))
  assert.deepEqual(calls[2].body, serviceValues(service))
  await serviceApi.update(1, { ...serviceValues(service), checkEnabled: false })
  const uncheckedBody = calls.at(-1)!.body as { checkEnabled: boolean }
  assert.equal(uncheckedBody.checkEnabled, false)
  assert.equal(Object.hasOwn(uncheckedBody, "check_enabled"), false)
  assert.deepEqual(calls[4].body, { ids: [3, 2, 1] })
  globalThis.fetch = async () => new Response("需要登录", { status: 401, headers: { "content-type": "text/plain" } })
  await assert.rejects(serviceApi.list(), /需要登录/)
  await assert.rejects(serviceApi.update(1, serviceValues(service)), /需要登录/)
} finally {
  globalThis.fetch = originalFetch
}
console.log("Service payload/order/API routes/error propagation checks passed")
