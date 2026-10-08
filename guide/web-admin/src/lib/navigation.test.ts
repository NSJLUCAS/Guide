/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { ADMIN_SECTIONS, normaliseAdminPath } from "./navigation.ts"

test("导航后台包含独立分类入口并保留现有入口", () => {
  assert.deepEqual(ADMIN_SECTIONS.map(s => s.label), ["服务", "分类", "主题", "安全", "设置"])
})

test("登录与旧探针书签落到服务页，有效导航路由保持", () => {
  for (const path of ["/admin", "/admin/", "/admin/nodes", "/admin/ping", "/admin/notify", "/admin/data", "/admin/update", "/admin/missing"]) {
    assert.equal(normaliseAdminPath(path), "/admin/services")
  }
  for (const section of ADMIN_SECTIONS) {
    assert.equal(normaliseAdminPath(section.path), section.path)
    assert.equal(normaliseAdminPath(section.path + "/"), section.path)
  }
})
