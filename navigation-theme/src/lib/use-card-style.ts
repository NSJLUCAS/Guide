import { useEffect, useState } from "react"
import { getPublicAppearance, type Appearance } from "./public-config.ts"

/**
 * The hub's public appearance settings. The walker starts hidden until the hub
 * answers, so a visitor never sees him appear and vanish on a hub that has
 * switched him off.
 */
export function useAppearance(): Appearance {
  const [appearance, setAppearance] = useState<Appearance>({ cardStyle: "standard", footerWalker: false })
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let loading = false
    let queued = false
    const load = async () => {
      if (controller.signal.aborted) return
      if (loading) { queued = true; return }
      clearTimeout(timer)
      loading = true
      const next = await getPublicAppearance(controller.signal)
      loading = false
      if (controller.signal.aborted) return
      setAppearance(previous => previous.cardStyle === next.cardStyle && previous.footerWalker === next.footerWalker ? previous : next)
      // A save/focus arriving during a request gets a fresh read afterwards.
      if (queued) { queued = false; void load() }
      else timer = setTimeout(load, 5000)
    }
    const refresh = () => { void load() }
    const visible = () => { if (document.visibilityState === "visible") refresh() }
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("navigation-appearance")
    if (channel) channel.onmessage = event => { if (event.data?.type === "refresh") refresh() }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", visible)
    refresh()
    return () => {
      controller.abort()
      clearTimeout(timer)
      channel?.close()
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", visible)
    }
  }, [])
  return appearance
}
