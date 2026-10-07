import assert from "node:assert/strict"
import { test } from "node:test"
import { categoryOptions, normalizeCategory } from "./categories.ts"

test("所有服务的分类 trim、去重并忽略空分类", () => {
  assert.deepEqual(categoryOptions([{category:"工具"},{category:" 工具 "},{category:"影音"},{category:" "},{category:""}]), ["工具","影音"])
})
test("新分类和编辑分类保持原字段规则，空值仍为空", () => {
  assert.equal(normalizeCategory(" 新分类 "), "新分类")
  assert.equal(normalizeCategory(" 工具 "), "工具")
  assert.equal(normalizeCategory("  "), "")
  assert.throws(() => normalizeCategory("长".repeat(101)), /100/)
})
