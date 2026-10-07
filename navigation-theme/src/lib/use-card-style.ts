import { useEffect, useState } from "react"
import type { CardStyle } from "./card-style.ts"
import { getPublicCardStyle } from "./public-config.ts"

export function useCardStyle(): CardStyle {
  const [style, setStyle] = useState<CardStyle>("standard")
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
      const next = await getPublicCardStyle(controller.signal)
      loading = false
      if (controller.signal.aborted) return
      setStyle(next)
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
  return style
}
