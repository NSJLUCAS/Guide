/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { cardStyleFromConfig, cardGridClass } from "./card-style.ts"
import { getPublicCardStyle } from "./public-config.ts"

test("public card style defaults safely and accepts only the three declared styles", () => {
  for (const value of [undefined, null, "", "dense", {}, 0, "STANDARD"]) {
    assert.equal(cardStyleFromConfig({ cardStyle: value }), "standard")
  }
  for (const value of [null, [], "compact", {}]) assert.equal(cardStyleFromConfig(value), "standard")
  for (const cardStyle of ["standard", "compact", "minimal"]) {
    assert.equal(cardStyleFromConfig({ cardStyle }), cardStyle)
  }
})

test("standard keeps the original grid; denser styles remain single column on phones", () => {
  assert.equal(cardGridClass("standard"), "grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")
  for (const style of ["compact", "minimal"] as const) {
    const grid = cardGridClass(style)
    assert.match(grid, /grid-cols-1/)
    assert.match(grid, /sm:grid-cols-2/)
    assert.match(grid, /2xl:grid-cols-6/)
    assert.notEqual(grid, cardGridClass("standard"))
  }
})

test("public appearance requests only the public endpoint and falls back on invalid/error replies", async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  try {
    for (const [reply, expected] of [[{cardStyle:"compact"}, "compact"], [{cardStyle:"minimal"}, "minimal"], [{cardStyle:"dense"}, "standard"], [{service_card_style:"compact"}, "standard"]] as const) {
      globalThis.fetch = async (input, init) => {
        calls.push(String(input))
        assert.equal(init?.cache, "no-store")
        return Response.json(reply)
      }
      assert.equal(await getPublicCardStyle(), expected)
    }
    globalThis.fetch = async () => new Response("unavailable", { status: 503 })
    assert.equal(await getPublicCardStyle(), "standard")
    globalThis.fetch = async () => new Response("not JSON")
    assert.equal(await getPublicCardStyle(), "standard")
    globalThis.fetch = async () => { throw new Error("network") }
    assert.equal(await getPublicCardStyle(), "standard")
    assert.deepEqual(calls, Array(4).fill("/api/public-config"))
  } finally { globalThis.fetch = original }
})

test("public appearance aborts a stalled request and respects caller cancellation", async () => {
  const original = globalThis.fetch
  const signals: AbortSignal[] = []
  globalThis.fetch = async (_input, init) => new Promise((_resolve, reject) => {
    const signal = init!.signal!
    signals.push(signal)
    if (signal.aborted) reject(new Error("aborted"))
    else signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true })
  })
  try {
    assert.equal(await getPublicCardStyle(undefined, 20), "standard")
    assert.equal(signals[0].aborted, true)
    const controller = new AbortController()
    const result = getPublicCardStyle(controller.signal)
    controller.abort()
    assert.equal(await result, "standard")
    assert.equal(signals[1].aborted, true)
  } finally { globalThis.fetch = original }
})
