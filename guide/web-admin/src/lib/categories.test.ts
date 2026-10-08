import assert from "node:assert/strict"
import { test } from "node:test"
import { categoryApi, categoryChoices, categoryName, categoriesFromApi, moveCategory, categoryOptions, normalizeCategory } from "./categories.ts"

test("所有服务的分类 trim、去重并忽略空分类", () => {
  assert.deepEqual(categoryOptions([{category:"工具"},{category:" 工具 "},{category:"影音"},{category:" "},{category:""}]), ["工具","影音"])
})

test("服务选择器优先使用管理顺序，包含没有网站的分类", () => {
  assert.deepEqual(categoryOptions([{category:"工具"},{category:"影音"}], ["空分类","影音","工具"]), ["空分类","影音","工具"])
})
test("新分类和编辑分类保持原字段规则，空值仍为空", () => {
  assert.equal(normalizeCategory(" 新分类 "), "新分类")
  assert.equal(normalizeCategory(" 工具 "), "工具")
  assert.equal(normalizeCategory("  "), "")
  assert.throws(() => normalizeCategory("长".repeat(101)), /100/)
})

test("管理分类校验、箭头排序及接口请求保持一致", async () => {
  const rows = [{ id: 2, name: "空分类", sort: 0, count: 0 }, { id: 1, name: "工具", sort: 1, count: 3 }]
  assert.deepEqual(categoriesFromApi(rows), rows)
  assert.deepEqual(moveCategory(rows, 1, -1).map(row => row.id), [1, 2])
  assert.deepEqual(rows.map(row => row.id), [2, 1])
  for (const name of ["", "bad\nname", "长".repeat(101)]) assert.throws(() => categoryName(name))
  for (const value of [{}, [...rows, rows[0]], [{ ...rows[0], count: -1 }]]) assert.throws(() => categoriesFromApi(value), /分类数据格式/)
  const original = globalThis.fetch
  const calls: { url: string; method: string; body: unknown }[] = []
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null })
    return init?.method === "POST" ? Response.json({ ok: true }, { status: 201 }) : init?.method ? new Response(null, { status: 204 }) : Response.json(rows)
  }
  try {
    assert.deepEqual(await categoryChoices(), ["空分类", "工具"])
    await categoryApi.create(" 新分类 "); await categoryApi.update(2," 编辑 "); await categoryApi.order([1,2]); await categoryApi.remove(2)
    assert.deepEqual(calls, [
      { url: "/api/categories", method: "GET", body: null },
      { url: "/api/categories", method: "POST", body: { name: "新分类" } },
      { url: "/api/categories/2", method: "PUT", body: { name: "编辑" } },
      { url: "/api/categories/order", method: "PUT", body: { ids: [1,2] } },
      { url: "/api/categories/2", method: "DELETE", body: null },
    ])
    globalThis.fetch = async () => new Response("", { status: 404 })
    assert.equal(await categoryChoices(), undefined)
    globalThis.fetch = async () => new Response("加载失败", { status: 503 })
    await assert.rejects(categoryChoices(), /加载失败/)
  } finally { globalThis.fetch = original }
})
