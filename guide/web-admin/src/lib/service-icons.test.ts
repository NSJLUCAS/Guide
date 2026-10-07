import assert from "node:assert/strict"
import { test } from "node:test"
import { discoverServiceIcons, websiteIconCandidates } from "./service-icons.ts"

test("只接受HTTPS候选，不保存清单，错误和空候选明确处理", () => {
  assert.deepEqual(websiteIconCandidates({icons:[{name:"icon",url:"https://icons.example/a.png"},{name:"duplicate",url:"https://icons.example/a.png"},{name:"unsafe",url:"http://example/a"},{name:"credentials",url:"https://@example/a"}]}),[{name:"icon",url:"https://icons.example/a.png"}])
  assert.deepEqual(websiteIconCandidates({icons:[]}),[])
  assert.throws(()=>websiteIconCandidates({items:[]}),/格式/)
})
test("仅调用手动发现API，trim地址，拒绝非法输入并传播失败", async () => {
  const previous = globalThis.fetch
  const calls: unknown[] = []
  globalThis.fetch = async (url,init) => { calls.push({url,method:init?.method,body:JSON.parse(String(init?.body))});return Response.json({icons:[{name:"favicon.ico",url:"https://example.com/favicon.ico"}]}) }
  try {
    assert.deepEqual(await discoverServiceIcons(" https://example.com/path "),[{name:"favicon.ico",url:"https://example.com/favicon.ico"}])
    assert.deepEqual(calls,[{url:"/api/services/discover-icon",method:"POST",body:{url:"https://example.com/path"}}])
    for (const url of ["", "ftp://example.com", "https://@example.com", "https://user:pass@example.com"]) await assert.rejects(discoverServiceIcons(url),/网站地址/)
    assert.equal(calls.length,1)
    globalThis.fetch = async()=>new Response("发现失败",{status:400,headers:{"content-type":"text/plain"}})
    await assert.rejects(discoverServiceIcons("https://example.com"),/发现失败/)
  } finally { globalThis.fetch=previous }
})
