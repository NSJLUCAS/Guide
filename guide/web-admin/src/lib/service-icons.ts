import { api } from "./api.ts"
import { safeIconUrl } from "./icons.ts"

export type DiscoveredIcon = { name: string; url: string }

export function websiteIconCandidates(value: unknown): DiscoveredIcon[] {
  if (!value || typeof value !== "object" || !("icons" in value) || !Array.isArray(value.icons)) throw new Error("网站图标数据格式无效")
  const icons: DiscoveredIcon[] = []
  const seen = new Set<string>()
  for (const entry of value.icons) {
    if (!entry || typeof entry !== "object" || typeof entry.name !== "string" || typeof entry.url !== "string") throw new Error("网站图标数据格式无效")
    const url = safeIconUrl(entry.url)
    if (url && !seen.has(url)) { seen.add(url); icons.push({name:entry.name.trim() || "icon",url}) }
    if (icons.length === 20) break
  }
  return icons
}

export async function discoverServiceIcons(value: string, signal?: AbortSignal): Promise<DiscoveredIcon[]> {
  const url = value.trim()
  const authority = /^https?:\/\/([^/?#]+)/i.exec(url)?.[1]
  try {
    const parsed = new URL(url)
    if (!authority || authority.includes("@") || [...url].length > 2048 || !["http:","https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error("invalid")
  } catch { throw new Error("请先填写不含登录凭据的 HTTP / HTTPS 网站地址") }
  return websiteIconCandidates(await api<unknown>("/services/discover-icon", {method:"POST",body:JSON.stringify({url}),signal}))
}
