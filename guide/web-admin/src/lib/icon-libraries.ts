import { api } from "./api.ts"
import { safeIconUrl } from "./icons.ts"

export type IconLibrary = { id: string; name: string; url: string }
export type IconLibraries = { activeId: string; libraries: IconLibrary[] }

export function parseIconLibraries(value: unknown): IconLibraries {
  if (!value || typeof value !== "object" || !("activeId" in value) || typeof value.activeId !== "string"
    || !("libraries" in value) || !Array.isArray(value.libraries)) throw new Error("图标库配置格式无效")
  if (value.libraries.length > 20) throw new Error("最多配置 20 个图标库")
  const seen = new Set<string>()
  const libraries = value.libraries.map((entry: unknown): IconLibrary => {
    if (!entry || typeof entry !== "object" || !("id" in entry) || typeof entry.id !== "string"
      || !("name" in entry) || typeof entry.name !== "string" || !("url" in entry) || typeof entry.url !== "string") throw new Error("图标库配置格式无效")
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(entry.id) || seen.has(entry.id)) throw new Error("图标库标识无效或重复")
    seen.add(entry.id)
    const name = entry.name.trim()
    if (!name || [...name].length > 100) throw new Error("请填写图标库名称，最多 100 字符")
    const url = safeIconUrl(entry.url)
    if (!url) throw new Error("图标库地址必须是无登录凭据的 HTTPS 地址，最多 2048 字符")
    return { id: entry.id, name, url }
  })
  if (libraries.length ? !seen.has(value.activeId) : value.activeId !== "") throw new Error("请选择有效的当前图标库")
  const config = { activeId: value.activeId, libraries }
  if (new TextEncoder().encode(JSON.stringify(config)).length > 60 * 1024) throw new Error("图标库配置过大")
  return config
}

export async function loadIconLibraries(): Promise<IconLibraries> {
  const settings = await api<{ icon_libraries: string }>("/settings")
  if (typeof settings.icon_libraries !== "string") throw new Error("服务器未提供图标库配置，请确认 Hub 已升级")
  let value: unknown
  try { value = JSON.parse(settings.icon_libraries) } catch { throw new Error("图标库配置 JSON 无效") }
  return parseIconLibraries(value)
}

export async function saveIconLibraries(value: IconLibraries): Promise<IconLibraries> {
  const config = parseIconLibraries(value)
  await api("/settings", { method: "PUT", body: JSON.stringify({ icon_libraries: JSON.stringify(config) }) })
  return config
}
