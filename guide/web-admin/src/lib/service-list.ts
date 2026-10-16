import type { Service } from "./api.ts"

export type ServiceTab = { value: string; label: string; count: number }

/**
 * One tab per category that has services: the managed order when the hub has
 * one, otherwise the order of first use, with uncategorized services last.
 */
export function serviceTabs(services: readonly Service[], managed?: readonly string[]): ServiceTab[] {
  const counts = new Map<string, number>()
  for (const service of services) counts.set(service.category, (counts.get(service.category) ?? 0) + 1)
  const named = [...counts.keys()].filter(Boolean)
  const order = managed ? [...managed.filter(name => counts.has(name)), ...named.filter(name => !managed.includes(name))] : named
  const tabs = order.map(name => ({ value: name, label: name, count: counts.get(name)! }))
  return counts.has("") ? [...tabs, { value: "", label: "未分类", count: counts.get("")! }] : tabs
}

export function filterAdminServices(services: readonly Service[], category: string | null, query: string): Service[] {
  const search = query.trim().toLocaleLowerCase()
  return services.filter(service => (category === null || service.category === category)
    && (!search || [service.name, service.url, service.description].some(value => value.toLocaleLowerCase().includes(search))))
}

/** The host alone is enough to tell rows apart; the full address stays in the row's tooltip. */
export function serviceHost(url: string): string {
  try { return new URL(url).host || url } catch { return url }
}
