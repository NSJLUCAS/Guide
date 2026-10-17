import assert from "node:assert/strict"
import { test } from "node:test"
import { rememberNext, takeNext } from "./next.ts"

function memory() {
  const map = new Map<string, string>()
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), removeItem: (k: string) => void map.delete(k) }
}

test("登录后只回到导航首页，且只回一次", () => {
  const store = memory()
  rememberNext("?next=/", store)
  assert.equal(takeNext(store), "/")
  assert.equal(takeNext(store), null)
})

test("站外或其他地址一律不认", () => {
  for (const search of ["", "?next=", "?next=//evil.example", "?next=https://evil.example/", "?next=/admin/services", "?next=%2F%2Fevil.example", "?next=/%5Cevil.example"]) {
    const store = memory()
    rememberNext(search, store)
    assert.equal(takeNext(store), null, search)
  }
  const store = memory()
  store.setItem("guide-next", "https://evil.example/")
  assert.equal(takeNext(store), null)
})

test("存储不可用时留在后台", () => {
  const broken = { getItem() { throw new Error("blocked") }, setItem() { throw new Error("blocked") }, removeItem() { throw new Error("blocked") } }
  rememberNext("?next=/", broken)
  assert.equal(takeNext(broken), null)
})
