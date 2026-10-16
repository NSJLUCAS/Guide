import { api } from "./api.ts"
import { cardStyleFromConfig, footerWalkerFromConfig, type CardStyle } from "./card-style.ts"

export type Appearance = { cardStyle: CardStyle; footerWalker: boolean }
export const DEFAULT_APPEARANCE: Appearance = { cardStyle: "standard", footerWalker: true }

/** A missing/old Hub or bad configuration must preserve the original layout. */
export async function getPublicCardStyle(signal?: AbortSignal, timeoutMs = 5000): Promise<CardStyle> {
  return (await getPublicAppearance(signal, timeoutMs)).cardStyle
}

export async function getPublicAppearance(signal?: AbortSignal, timeoutMs = 5000): Promise<Appearance> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timer = setTimeout(abort, timeoutMs)
  try {
    const config = await api<unknown>("/public-config", { signal: controller.signal, cache: "no-store" })
    return { cardStyle: cardStyleFromConfig(config), footerWalker: footerWalkerFromConfig(config) }
  } catch {
    return DEFAULT_APPEARANCE
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", abort)
  }
}
