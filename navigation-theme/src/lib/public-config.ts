import { api } from "./api.ts"
import { cardStyleFromConfig, type CardStyle } from "./card-style.ts"

/** A missing/old Hub or bad configuration must preserve the original layout. */
export async function getPublicCardStyle(signal?: AbortSignal, timeoutMs = 5000): Promise<CardStyle> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timer = setTimeout(abort, timeoutMs)
  try {
    return cardStyleFromConfig(await api<unknown>("/public-config", { signal: controller.signal, cache: "no-store" }))
  } catch {
    return "standard"
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", abort)
  }
}
