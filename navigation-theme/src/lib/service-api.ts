import { api, ApiError } from "./api.ts"
import type { Service, ServiceStatus } from "./services.ts"
import { currentService } from "./services.ts"

/** Convert the Hub response into card data, leaving persistence fields at the boundary. */
export function servicesFromApi(value: unknown, now = Date.now()): Service[] {
  if (!Array.isArray(value)) throw new Error("网站数据格式不正确，请重试")
  return value.map(row => {
    if (!row || typeof row !== "object" || !Number.isSafeInteger(row.id)
      || typeof row.name !== "string" || typeof row.url !== "string"
      || typeof row.description !== "string" || typeof row.category !== "string"
      || (row.icon !== null && typeof row.icon !== "string")) {
      throw new Error("网站数据格式不正确，请重试")
    }
    const status: ServiceStatus = row.status === "online" || row.status === "offline" || row.status === "protected" || row.status === "unchecked" ? row.status : "unknown"
    return currentService({
      id: row.id, name: row.name, url: row.url, description: row.description,
      category: row.category, icon: row.icon || null, status,
      responseMs: status === "online" && typeof row.responseMs === "number" && Number.isFinite(row.responseMs) && row.responseMs >= 0 ? row.responseMs : null,
      checkedAt: typeof row.checkedAt === "string" && Number.isFinite(Date.parse(row.checkedAt)) ? row.checkedAt : null,
      checkEnabled: row.checkEnabled !== false,
    }, now)
  })
}

export async function getServices(signal?: AbortSignal): Promise<Service[]> {
  return servicesFromApi(await api<unknown>("/services", { signal, cache: "no-store" }))
}

export async function getCategories(signal?: AbortSignal): Promise<string[] | undefined> {
  let value: unknown
  try { value = await api<unknown>("/categories", { signal, cache: "no-store" }) }
  catch (error) { if (error instanceof ApiError && error.status === 404) return undefined; throw error }
  if (!Array.isArray(value) || value.some(row => !row || !Number.isSafeInteger(row.id) || row.id <= 0
    || typeof row.name !== "string" || !row.name || !Number.isSafeInteger(row.sort)
    || !Number.isSafeInteger(row.count) || row.count < 0)
    || new Set(value.map(row => row.id)).size !== value.length
    || new Set(value.map(row => row.name)).size !== value.length) throw new Error("分类数据格式不正确，请重试")
  return value.map(row => row.name)
}

/** A rename can land between the two reads. Retry before publishing mixed data. */
export async function getNavigationData(signal?: AbortSignal) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [services, managedCategories] = await Promise.all([getServices(signal), getCategories(signal)])
    if (managedCategories === undefined || services.every(service => !service.category || managedCategories.includes(service.category))) {
      return { services, managedCategories }
    }
  }
  throw new Error("分类已发生变化，请重试")
}
