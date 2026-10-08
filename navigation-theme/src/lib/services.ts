export type ServiceStatus = "online" | "offline" | "protected" | "unknown" | "unchecked"

/** Public card data. checkedAt is an ISO timestamp; missing measurements are null. */
export type Service = {
  id: number
  name: string
  description: string
  category: string
  icon: string | null
  url: string
  status: ServiceStatus
  responseMs: number | null
  checkedAt: string | null
  checkEnabled?: boolean
}

export const SERVICE_STALE_MS = 180_000

/** Re-evaluate cached data as time passes, including when a refresh fails. */
export function currentService(service: Service, now = Date.now()): Service {
  if (service.checkEnabled === false || service.status === "unchecked") {
    return { ...service, status: "unchecked", responseMs: null, checkedAt: null }
  }
  if (service.status === "online" || service.status === "offline" || service.status === "protected") {
    const checked = service.checkedAt ? Date.parse(service.checkedAt) : NaN
    if (!Number.isFinite(checked) || checked > now || now - checked > SERVICE_STALE_MS) {
      return { ...service, status: "unknown", responseMs: null }
    }
  }
  return service.status === "online" ? service : { ...service, responseMs: null }
}

export function categoriesOf(services: readonly Service[]) {
  const counts = new Map<string, number>()
  for (const service of services) counts.set(service.category, (counts.get(service.category) ?? 0) + 1)
  return [...counts].map(([value, count]) => ({ value, label: value || "未分类", count }))
}

export function filterServices(services: readonly Service[], category: string | null, query: string) {
  const search = query.trim().toLocaleLowerCase()
  return services.filter(s => (category === null || s.category === category) &&
    (!search || [s.name, s.description, serviceDomain(s.url)].some(value => value.toLocaleLowerCase().includes(search))))
}

function measured(s: Service) {
  return s.status === "online" && s.responseMs !== null && Number.isFinite(s.responseMs) && s.responseMs >= 0
}

export function serviceSummary(services: readonly Service[]) {
  const responses = services.filter(measured)
  return {
    total: services.length,
    online: services.filter(s => s.status === "online").length,
    offline: services.filter(s => s.status === "offline").length,
    unknown: services.filter(s => s.status === "unknown").length,
    categories: new Set(services.map(s => s.category).filter(Boolean)).size,
    averageMs: responses.length ? Math.round(responses.reduce((sum, s) => sum + s.responseMs!, 0) / responses.length) : null,
  }
}

export function responseLabel(service: Service) {
  return measured(service) ? `${Math.round(service.responseMs!)} ms` : "—"
}

export function checkedLabel(checkedAt: string | null, now = Date.now()) {
  const time = checkedAt ? Date.parse(checkedAt) : NaN
  if (!Number.isFinite(time) || time > now) return "尚未检测"
  const minutes = Math.floor((now - time) / 60_000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
  return `${Math.floor(minutes / 1440)} 天前`
}

export function serviceHref(value: string): string | null {
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

export function serviceDomain(value: string) {
  const href = serviceHref(value)
  return href ? new URL(href).host : "无效地址"
}
