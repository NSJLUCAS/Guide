import { api, ApiError, moveService, serviceApi } from "./api.ts"

export type Category = { id: number; name: string; sort: number; count: number }

export function categoryOptions(services: { category: string }[], managed?: readonly string[]): string[] {
  if (managed !== undefined) return [...managed]
  return [...new Set(services.map(service => service.category.trim()).filter(Boolean))]
}

export function categoryName(value: string): string {
  const name = normalizeCategory(value)
  if (!name || [...name].some(char => { const code = char.codePointAt(0)!; return code < 32 || (code >= 127 && code <= 159) })) throw new Error("请填写不含控制字符的分类名称")
  return name
}

export function categoriesFromApi(value: unknown): Category[] {
  if (!Array.isArray(value) || value.some(row => !row || !Number.isSafeInteger(row.id) || row.id <= 0
    || typeof row.name !== "string" || !row.name || !Number.isSafeInteger(row.sort)
    || !Number.isSafeInteger(row.count) || row.count < 0)
    || new Set(value.map(row => row.id)).size !== value.length || new Set(value.map(row => row.name)).size !== value.length) {
    throw new Error("分类数据格式不正确，请重试")
  }
  return value
}

export const categoryApi = {
  list: async (signal?: AbortSignal) => categoriesFromApi(await api<unknown>("/categories", { signal, cache: "no-store" })),
  create: (name: string) => api("/categories", { method: "POST", body: JSON.stringify({ name: categoryName(name) }) }),
  update: (id: number, name: string) => api(`/categories/${id}`, { method: "PUT", body: JSON.stringify({ name: categoryName(name) }) }),
  remove: (id: number) => api(`/categories/${id}`, { method: "DELETE" }),
  order: (ids: number[]) => api("/categories/order", { method: "PUT", body: JSON.stringify({ ids }) }),
}

/** A pre-category hub has no endpoint; other failures must keep forms locked. */
export async function categoryChoices(signal?: AbortSignal): Promise<string[] | undefined> {
  try { return (await categoryApi.list(signal)).map(category => category.name) }
  catch (error) { if (error instanceof ApiError && error.status === 404) return undefined; throw error }
}

/** A rename can commit between reads; publish only a consistent editable pair. */
export async function getServiceData(signal?: AbortSignal) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [services, managedCategories] = await Promise.all([serviceApi.list(signal), categoryChoices(signal)])
    if (managedCategories === undefined || services.every(service => !service.category || managedCategories.includes(service.category))) {
      return { services, managedCategories }
    }
  }
  throw new Error("分类已发生变化，请重试")
}

export const moveCategory = moveService

export function categoriesChanged() {
  if (typeof BroadcastChannel === "undefined") return
  const channel = new BroadcastChannel("navigation-categories")
  channel.postMessage({ type: "refresh" })
  channel.close()
}

export function normalizeCategory(value: string): string {
  const category = value.trim()
  if ([...category].length > 100) throw new Error("分类名称最多 100 字符")
  return category
}
