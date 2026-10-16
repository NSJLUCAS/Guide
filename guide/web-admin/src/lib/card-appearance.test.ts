import assert from "node:assert/strict"
import { test } from "node:test"
import { cardStyle, footerWalker, loadAppearance, loadCardStyle, saveCardStyle, saveFooterWalker } from "./card-appearance.ts"
test("外观默认标准且非法读取回退，三种设置使用服务器存储", async () => {
  assert.equal(cardStyle(undefined),"standard")
  assert.equal(cardStyle("huge"),"standard")
  const original=globalThis.fetch
  let stored: unknown
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,"/api/settings")
    if(init?.method==="PUT") { const patch=JSON.parse(String(init.body));assert.deepEqual(Object.keys(patch),["service_card_style"]);stored=patch.service_card_style;return Response.json({ok:true}) }
    return Response.json({service_card_style:stored})
  }
  try {
    assert.equal(await loadCardStyle(),"standard")
    for(const style of ["standard","compact","minimal"] as const) { await saveCardStyle(style);assert.equal(await loadCardStyle(),style) }
    await assert.rejects(saveCardStyle("bad" as never),/无效/)
  } finally {globalThis.fetch=original}
})
test("页脚动画默认开启，只写 footer_walker", async () => {
  assert.equal(footerWalker(undefined),true)
  assert.equal(footerWalker("on"),true)
  assert.equal(footerWalker("off"),false)
  const original=globalThis.fetch
  let stored: unknown
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,"/api/settings")
    if(init?.method==="PUT") { const patch=JSON.parse(String(init.body));assert.deepEqual(Object.keys(patch),["footer_walker"]);stored=patch.footer_walker;return Response.json({ok:true}) }
    return Response.json({service_card_style:"compact",footer_walker:stored})
  }
  try {
    assert.deepEqual(await loadAppearance(),{style:"compact",walker:true})
    await saveFooterWalker(false);assert.equal(stored,"off");assert.deepEqual(await loadAppearance(),{style:"compact",walker:false})
    await saveFooterWalker(true);assert.equal(stored,"on")
  } finally {globalThis.fetch=original}
})
