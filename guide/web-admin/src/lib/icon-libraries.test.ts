import assert from "node:assert/strict"
import { test } from "node:test"
import { loadIconLibraries, parseIconLibraries, saveIconLibraries } from "./icon-libraries.ts"

const a = { id: "one", name: " 第一库 ", url: " https://one.example.com/icons.json " }
const b = { id: "two", name: "第二库", url: "https://two.example.com/icons.json" }
test("配置支持多个库、规范空白、空列表和拒绝非法URL/结构", () => {
  assert.deepEqual(parseIconLibraries({ activeId: "one", libraries: [a,b] }).libraries[0], {...a,name:"第一库",url:a.url.trim()})
  assert.deepEqual(parseIconLibraries({activeId:"",libraries:[]}), {activeId:"",libraries:[]})
  for (const url of ["http://example.com/a", "https://@example.com/a", "https://user:pass@example.com/a", "https://example.com/" + "x".repeat(2048)]) {
    assert.throws(() => parseIconLibraries({activeId:"one",libraries:[{...a,url}]}), /HTTPS/)
  }
  assert.throws(() => parseIconLibraries({activeId:"other",libraries:[a]}), /当前/)
  assert.throws(() => parseIconLibraries({activeId:"one",libraries:[a,a]}), /重复/)
  assert.throws(() => parseIconLibraries({activeId:"one",libraries:[{...a,name:" "}]}), /名称/)
})
test("复用settings API持久化添加、编辑、切换和删除，不保存图片清单", async () => {
  const original = globalThis.fetch
  let stored = JSON.stringify({activeId:"one",libraries:[a]})
  const requests: string[] = []
  globalThis.fetch = async (url, init) => {
    requests.push(String(url))
    if (init?.method === "PUT") {
      const patch = JSON.parse(String(init.body))
      assert.deepEqual(Object.keys(patch), ["icon_libraries"])
      stored = patch.icon_libraries
      return Response.json({ok:true})
    }
    return Response.json({icon_libraries:stored})
  }
  try {
    assert.equal((await loadIconLibraries()).libraries.length,1)
    await saveIconLibraries({activeId:"two",libraries:[a,b]})
    assert.equal((await loadIconLibraries()).activeId,"two")
    await saveIconLibraries({activeId:"two",libraries:[{...b,name:"修改后",url:"https://edited.example.com/list.json"}]})
    assert.equal((await loadIconLibraries()).libraries[0].name,"修改后")
    await saveIconLibraries({activeId:"",libraries:[]})
    assert.deepEqual(await loadIconLibraries(),{activeId:"",libraries:[]})
    assert.ok(requests.every(url => url === "/api/settings"))
  } finally { globalThis.fetch = original }
})
