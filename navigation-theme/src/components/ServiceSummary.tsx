import { Activity, Folder, Gauge, Globe } from "lucide-react"

import { Card } from "@/components/ui/card"
import { serviceSummary, type Service } from "@/lib/services"

/** Same tile shell and four-column rules as the original Summary, without charts. */
export function ServiceSummary({ services }: { services: readonly Service[] }) {
  const stats = serviceSummary(services)
  const protectedCount = services.filter(service => service.status === "protected").length
  const tiles = [
    { icon: Globe, label: "网站", value: stats.total, foot: "当前筛选的网站" },
    { icon: Activity, label: "在线", value: stats.online, foot: `${stats.offline} 个离线 · ${stats.unknown} 个未知${protectedCount ? ` · ${protectedCount} 个检测受限` : ""}` },
    { icon: Folder, label: "分类", value: stats.categories, foot: "当前筛选的分类" },
    { icon: Gauge, label: "平均响应", value: stats.averageMs === null ? "—" : `${stats.averageMs} ms`, foot: "仅统计在线响应" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="网站统计">
      {tiles.map(({ icon: Icon, label, value, foot }) => (
        <Card key={label} className="min-w-0 gap-0 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon aria-hidden className="size-3.5" />{label}
          </div>
          <div className="tnum mt-1 text-xl font-semibold">{value}</div>
          <div className="mt-auto pt-1 text-xs text-muted-foreground">{foot}</div>
        </Card>
      ))}
    </div>
  )
}
