import { useState } from "react"
import { ArrowRight, Globe } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { checkedLabel, responseLabel, serviceDomain, serviceHref, type Service } from "@/lib/services"
import { cn } from "@/lib/utils"
import type { CardStyle } from "@/lib/card-style"

function ServiceIcon({ icon, small = false }: { icon: Service["icon"]; small?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const image = icon && icon.startsWith("https://") ? serviceHref(icon) : null
  if (image && failed !== image) return (
    <img src={image} alt="" className={small ? "size-3.5 shrink-0 object-contain" : "size-4 shrink-0 object-contain"} referrerPolicy="no-referrer"
      onError={() => setFailed(image)} />
  )
  return <Globe aria-hidden className={small ? "size-3.5 shrink-0 text-muted-foreground" : "size-4 shrink-0 text-muted-foreground"} />
}

export function ServiceCard({ service, now, cardStyle = "standard" }: { service: Service; now: number; cardStyle?: CardStyle }) {
  if (cardStyle !== "standard") return <DenseServiceCard service={service} cardStyle={cardStyle} />
  const href = serviceHref(service.url)
  const label = { online: "在线", offline: "离线", unknown: "未知", unchecked: "未检测" }[service.status]
  return (
    <Card className="min-w-0 gap-0 p-4 transition-colors hover:border-ring" data-service-id={service.id} data-card-style="standard">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <ServiceIcon icon={service.icon} />
            <h2 className="truncate font-medium" title={service.name}>{service.name}</h2>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={service.description}>
            {service.description || "暂无简介"}
          </p>
        </div>
        <Badge variant="outline" className={cn("tnum shrink-0 gap-1.5 font-normal", service.status !== "online" && "text-muted-foreground")}>
          <span aria-hidden className={cn("size-1.5 rounded-full", service.status === "online" ? "bg-online" : service.status === "offline" ? "bg-offline" : "bg-muted-foreground/40")} />
          {label}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
        <div className="min-w-0">
          <dt className="text-muted-foreground">分类</dt>
          <dd className="mt-1 truncate" title={service.category || "未分类"}>{service.category || "未分类"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">响应时间</dt>
          <dd className="tnum mt-1">{responseLabel(service)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">地址</dt>
          <dd className="mt-1 truncate" title={href ?? undefined}>{serviceDomain(service.url)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">最近检测</dt>
          <dd className="tnum mt-1" title={service.checkedAt ?? undefined}>{checkedLabel(service.checkedAt, now)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end border-t pt-3">
        {href ? (
          <Button variant="ghost" size="xs" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`访问 ${service.name}（新窗口）`}>
              访问 <ArrowRight aria-hidden />
            </a>
          </Button>
        ) : <span className="text-xs text-muted-foreground">地址不可用</span>}
      </div>
    </Card>
  )
}

/** Alternate layouts share the original icon, status, response and link rules. */
function DenseServiceCard({ service, cardStyle }: { service: Service; cardStyle: "compact" | "minimal" }) {
  const href = serviceHref(service.url)
  const label = { online: "在线", offline: "离线", unknown: "未知", unchecked: "未检测" }[service.status]
  const compact = cardStyle === "compact"
  return (
    <Card className={cn("min-w-0 gap-0 transition-colors hover:border-ring", compact ? "rounded-lg p-3" : "rounded-lg px-3 py-2")}
      data-service-id={service.id} data-card-style={cardStyle}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <ServiceIcon icon={service.icon} small />
          <h2 className="truncate text-sm font-medium" title={service.name}>{service.name}</h2>
        </div>
        <Badge variant="outline" className={cn("tnum shrink-0 gap-1 px-1.5 text-[11px] font-normal", service.status !== "online" && "text-muted-foreground")}>
          <span aria-hidden className={cn("size-1.5 rounded-full", service.status === "online" ? "bg-online" : service.status === "offline" ? "bg-offline" : "bg-muted-foreground/40")} />
          {label}
        </Badge>
      </div>
      {compact && (
        <>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={service.description}>{service.description || "暂无简介"}</p>
          <p className="mt-2 truncate text-xs text-muted-foreground" title={service.category || "未分类"}>
            分类 <span className="text-foreground">{service.category || "未分类"}</span>
          </p>
        </>
      )}
      <div className={cn("flex min-w-0 items-center justify-between gap-2", compact ? "mt-2 border-t pt-1" : "mt-1")}>
        <span className="tnum truncate text-xs text-muted-foreground" aria-label={`响应时间 ${responseLabel(service)}`}>{responseLabel(service)}</span>
        {href ? (
          <Button variant="ghost" size="xs" className="h-11 min-w-11 sm:h-7" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`访问 ${service.name}（新窗口）`}>
              访问 <ArrowRight aria-hidden />
            </a>
          </Button>
        ) : <span className="text-xs text-muted-foreground">地址不可用</span>}
      </div>
    </Card>
  )
}
