import assert from "node:assert/strict"
import { test } from "node:test"
import { hasUpdate, loadGuideRelease, RELEASES_PAGE, releaseNotesUrl } from "./guide-release.ts"

test("新版本链接到对应的 GitHub Release，异常版本号退回发布列表", () => {
  assert.equal(releaseNotesUrl("1.2.4"), "https://github.com/NSJLUCAS/Guide/releases/tag/v1.2.4")
  for (const bad of ["", "v1.2.4", "1.2.4/../../evil", "latest"]) assert.equal(releaseNotesUrl(bad), RELEASES_PAGE)
})

test("只有更高的版本才算有更新", () => {
  assert.equal(hasUpdate(null), false)
  assert.equal(hasUpdate({ current: "1.2.3", latest: "" }), false)
  assert.equal(hasUpdate({ current: "1.2.3", latest: "1.2.3" }), false)
  assert.equal(hasUpdate({ current: "1.2.3", latest: "1.2.2" }), false)
  assert.equal(hasUpdate({ current: "1.2.3", latest: "1.2.10" }), true)
  assert.equal(hasUpdate({ current: "1.2.3", latest: "1.3.0" }), true)
})

test("读取 /api/guide-release", async () => {
  const original = globalThis.fetch
  globalThis.fetch = async url => { assert.equal(url, "/api/guide-release"); return Response.json({ current: "1.2.3", latest: "1.2.4" }) }
  try { assert.deepEqual(await loadGuideRelease(), { current: "1.2.3", latest: "1.2.4" }) }
  finally { globalThis.fetch = original }
})
