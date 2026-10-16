/// <reference types="node" />
import assert from "node:assert/strict"
import { serviceApi, serviceValues, moveService, dropService, type Service } from "./api.ts"
import { filterAdminServices, serviceHost, serviceTabs } from "./service-list.ts"

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
const five = [1, 2, 3, 4, 5].map(id => ({ id }))
const ids = (list: { id: number }[]) => list.map(s => s.id)
assert.deepEqual(ids(dropService(five, 1, 4, "after")), [2, 3, 4, 1, 5])
assert.deepEqual(ids(dropService(five, 5, 2, "before")), [1, 5, 2, 3, 4])
assert.deepEqual(ids(dropService(five, 3, 3, "before")), [1, 2, 3, 4, 5], "dropping on itself changes nothing")
assert.deepEqual(ids(dropService(five, 9, 2, "before")), [1, 2, 3, 4, 5], "an unknown row changes nothing")
// A filtered view drops relative to a visible row; the hidden rows keep their places.
assert.deepEqual(ids(dropService(five, 4, 2, "before")), [1, 4, 2, 3, 5])
assert.deepEqual(ids(five), [1, 2, 3, 4, 5], "source order must not mutate")

const listed = [
  { ...service, id: 1, name: "Emby", category: "影音", url: "https://emby.example.com/web", description: "家庭影院" },
  { ...service, id: 2, name: "Gitea", category: "开发", url: "https://git.example.com/", description: "" },
  { ...service, id: 3, name: "Notes", category: "", url: "https://notes.example.com/", description: "随手记" },
  { ...service, id: 4, name: "Jellyfin", category: "影音", url: "https://jf.example.com/", description: "" },
]
// Managed order first, empty managed categories left out, uncategorized last.
assert.deepEqual(serviceTabs(listed, ["开发", "空分类", "影音"]), [
  { value: "开发", label: "开发", count: 1 }, { value: "影音", label: "影音", count: 2 }, { value: "", label: "未分类", count: 1 },
])
// An older hub without managed categories orders them by first use.
assert.deepEqual(serviceTabs(listed).map(tab => tab.value), ["影音", "开发", ""])
assert.deepEqual(ids(filterAdminServices(listed, "影音", "")), [1, 4])
assert.deepEqual(ids(filterAdminServices(listed, "", "")), [3])
assert.deepEqual(ids(filterAdminServices(listed, null, " EMBY ")), [1])
assert.deepEqual(ids(filterAdminServices(listed, null, "git.example")), [2], "matches the address")
assert.deepEqual(ids(filterAdminServices(listed, null, "随手")), [3], "matches the description")
assert.deepEqual(ids(filterAdminServices(listed, "开发", "emby")), [])
assert.equal(serviceHost("https://emby.example.com:8096/web"), "emby.example.com:8096")
assert.equal(serviceHost("not a url"), "not a url")

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
