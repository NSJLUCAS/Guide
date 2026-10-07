export type CatalogIcon = { name: string; url: string }

/** Only credential-free, absolute HTTPS addresses can become remote images. */
export function safeIconUrl(value: string): string | null {
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed)
    const authority = /^https:\/\/([^/?#]+)/i.exec(trimmed)?.[1]
    if (!authority || authority.includes("@") || [...trimmed].length > 2048 || url.protocol !== "https:" || !url.hostname || url.username || url.password) return null
    return trimmed
  } catch { return null }
}

/** Preserve legacy simple-icons keys; an empty icon uses the theme fallback. */
export function validateIconInput(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return null
  const url = safeIconUrl(trimmed)
  if (url) return url
  if (/^[a-z0-9][a-z0-9._-]*$/i.test(trimmed)) return trimmed
  throw new Error("图标请填写不含用户名和密码的 HTTPS 地址或品牌名称")
}

export function parseIconCatalog(value: unknown): CatalogIcon[] {
  if (!value || typeof value !== "object" || !("name" in value) || typeof value.name !== "string" || !value.name.trim()
    || !("icons" in value) || !Array.isArray(value.icons)) throw new Error("无法识别此图标库格式")
  const icons: CatalogIcon[] = []
  const seen = new Set<string>()
  for (const entry of value.icons) {
    if (!entry || typeof entry !== "object" || typeof entry.name !== "string" || typeof entry.url !== "string") throw new Error("无法识别此图标库格式")
    const name = entry.name.trim()
    const url = safeIconUrl(entry.url)
    if (!name || !url || seen.has(url)) continue
    seen.add(url)
    icons.push({ name, url })
  }
  return icons
}

export function filterIcons(icons: CatalogIcon[], query: string): CatalogIcon[] {
  const text = query.trim().toLowerCase()
  return text ? icons.filter(icon => icon.name.toLowerCase().includes(text)) : icons
}

/** Lazy promise cache includes in-flight loads; a rejected request remains retryable. */
export function createIconCatalogLoader(): (source: string) => Promise<CatalogIcon[]> {
  const cache = new Map<string, Promise<CatalogIcon[]>>()
  return async source => {
    const url = safeIconUrl(source)
    if (!url) throw new Error("图标库地址必须是无登录凭据的 HTTPS 地址，最多 2048 字符")
    let pending = cache.get(url)
    if (!pending) {
      pending = (async () => {
        let response: Response
        try { response = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(15000) }) }
        catch { throw new Error("无法加载图标库，请检查网络或来源的 CORS 设置后重试") }
        if (!response.ok) throw new Error(`图标库暂时不可用（HTTP ${response.status}）`)
        let value: unknown
        try { value = await response.json() } catch { throw new Error("图标库 JSON 无效") }
        return parseIconCatalog(value)
      })().catch(error => { cache.delete(url); throw error })
      cache.set(url, pending)
    }
    return pending
  }
}

// Lives for this page, including after a Service form is closed and reopened.
export const loadIconCatalog = createIconCatalogLoader()
