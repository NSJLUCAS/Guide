import assert from "node:assert/strict"
import { test } from "node:test"
import type { Service } from "./api.ts"
import { iconTargets, visibilityTargets, withChanges } from "./category-batch.ts"

const service = (id: number, extra: Partial<Service> = {}): Service => ({
  id, name: `站点${id}`, url: `https://s${id}.example/`, description: "简介", icon: null, category: "工具", sort: id,
  public: false, enabled: true, checkEnabled: false, createdAt: 1, updatedAt: 1, status: "unknown", ...extra,
} as Service)

test("公开/私有只改需要改的网站", () => {
  const list = [service(1, { public: true }), service(2), service(3, { public: true })]
  assert.deepEqual(visibilityTargets(list, true).map(s => s.id), [2])
  assert.deepEqual(visibilityTargets(list, false).map(s => s.id), [1, 3])
})

test("图标更新可以只补空图标，也可以全部重新获取", () => {
  const list = [service(1, { icon: "https://s1.example/a.png" }), service(2), service(3, { icon: "  " })]
  assert.deepEqual(iconTargets(list, "missing").map(s => s.id), [2, 3])
  assert.deepEqual(iconTargets(list, "all").map(s => s.id), [1, 2, 3])
})

test("写回时保留其他字段，包括关闭的在线检测", () => {
  assert.deepEqual(withChanges(service(4, { icon: "emby" }), { public: true }), {
    name: "站点4", url: "https://s4.example/", description: "简介", icon: "emby", category: "工具", sort: 4,
    public: true, enabled: true, checkEnabled: false,
  })
})
