import { useState } from "react"
import { Globe } from "lucide-react"
import { safeIconUrl } from "@/lib/icons"

export function ServiceIconPreview({ icon }: { icon: string | null }) {
  const url = icon ? safeIconUrl(icon) : null
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return url && url !== failedUrl
    ? <img data-service-icon src={url} alt="" className="size-6 shrink-0 object-contain" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(url)} />
    : <Globe data-service-icon-fallback role="img" aria-label="默认图标" className="size-6 shrink-0 text-muted-foreground" />
}
