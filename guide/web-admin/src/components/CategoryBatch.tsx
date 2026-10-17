import { useEffect, useId, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { serviceApi, type Service } from "@/lib/api"
import { eachLimited } from "@/lib/bulk-paste"
import { iconTargets, visibilityTargets, withChanges, type IconScope } from "@/lib/category-batch"
import { discoverServicePage } from "@/lib/service-icons"

type Failure = { name: string; reason: string }
type Outcome = { summary: string; failures: Failure[] }

/** Icon pages are read four at a time, as the bulk paste dialog reads them. */
const READS = 4

/** One category's services, made public or private, or given fresh icons, in one go. */
export function CategoryBatch({ category, onClose }: { category: string; onClose: () => void }) {
  const [services, setServices] = useState<Service[] | null>(null)
  const [loadError, setLoadError] = useState("")
  const [scope, setScope] = useState<IconScope>("missing")
  const [running, setRunning] = useState("")
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const prefix = useId()

  // Bumped after every batch so the counts show what the hub now holds.
  const [reads, setReads] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    serviceApi.list(controller.signal).then(
      list => { setServices(list.filter(service => service.category === category)); setLoadError("") },
      error => { if (!controller.signal.aborted) setLoadError((error as Error).message) },
    )
    return () => controller.abort()
  }, [category, reads])

  async function batch(label: string, targets: Service[], work: (service: Service) => Promise<string | null>) {
    setRunning(label)
    setOutcome(null)
    setProgress({ done: 0, total: targets.length })
    const failures: Failure[] = []
    let changed = 0
    await eachLimited(targets, READS, async service => {
      try {
        const reason = await work(service)
        if (reason) failures.push({ name: service.name, reason })
        else changed++
      } catch (error) {
        failures.push({ name: service.name, reason: (error as Error).message })
      }
      setProgress(current => ({ ...current, done: current.done + 1 }))
    })
    const summary = `${label}：${changed} 个完成${failures.length ? `，${failures.length} 个未完成` : ""}`
    setOutcome({ summary, failures })
    setRunning("")
    if (changed) toast.success(summary)
    setReads(count => count + 1)
  }

  const setVisibility = (isPublic: boolean) => services && void batch(isPublic ? "设为公开" : "设为私有", visibilityTargets(services, isPublic),
    async service => { await serviceApi.update(service.id, withChanges(service, { public: isPublic })); return null })

  const refreshIcons = () => services && void batch("更新图标", iconTargets(services, scope), async service => {
    const icon = (await discoverServicePage(service.url)).icons[0]?.url
    if (!icon) return "网站没有提供图标，保留原图标"
    if (icon !== service.icon) await serviceApi.update(service.id, withChanges(service, { icon }))
    return null
  })

  const publicCount = services?.filter(service => service.public).length ?? 0
  const missing = services ? iconTargets(services, "missing").length : 0
  const busy = !!running
  return (
    <Dialog open onOpenChange={open => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>批量操作「{category}」</DialogTitle>
          <DialogDescription>对这个分类下的全部网站一次生效，已经符合的网站不会重复修改。</DialogDescription>
        </DialogHeader>
        {loadError ? <p role="alert" className="text-sm text-destructive">加载网站失败：{loadError}</p>
          : services === null ? <p role="status" className="text-sm text-muted-foreground">加载网站中…</p>
          : services.length === 0 ? <p className="text-sm text-muted-foreground">这个分类下还没有网站。</p>
          : <div className="space-y-5">
            <p className="text-sm text-muted-foreground">共 {services.length} 个网站：公开 {publicCount} 个 · 私有 {services.length - publicCount} 个 · 没有图标 {missing} 个</p>
            <section className="space-y-2" aria-labelledby={`${prefix}-visibility`}>
              <h3 id={`${prefix}-visibility`} className="text-sm font-medium">公开状态</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={busy || publicCount === services.length} onClick={() => setVisibility(true)}>全部设为公开</Button>
                <Button variant="outline" size="sm" disabled={busy || publicCount === 0} onClick={() => setVisibility(false)}>全部设为私有</Button>
              </div>
            </section>
            <section className="space-y-2" aria-labelledby={`${prefix}-icons`}>
              <h3 id={`${prefix}-icons`} className="text-sm font-medium">图标</h3>
              <fieldset disabled={busy} className="space-y-1.5 text-sm">
                <legend className="sr-only">更新范围</legend>
                <label className="flex items-start gap-2"><input type="radio" name={`${prefix}-scope`} className="mt-1 accent-primary" checked={scope === "missing"} onChange={() => setScope("missing")} />只补全没有图标的（{missing} 个）</label>
                <label className="flex items-start gap-2"><input type="radio" name={`${prefix}-scope`} className="mt-1 accent-primary" checked={scope === "all"} onChange={() => setScope("all")} /><span>全部重新获取（{services.length} 个）<span className="block text-xs text-muted-foreground">会用网站提供的第一个图标替换现有图标，包括手动选的。</span></span></label>
              </fieldset>
              <Button size="sm" disabled={busy || (scope === "missing" && missing === 0)} onClick={refreshIcons}>更新图标</Button>
            </section>
            {busy && <p role="status" className="text-sm text-muted-foreground">正在{running}… {progress.done}/{progress.total}</p>}
            {outcome && <div role="status" className="space-y-1 text-sm">
              <p>{outcome.summary}</p>
              {outcome.failures.length > 0 && <ul className="space-y-0.5 text-xs text-destructive">{outcome.failures.map((failure, index) => <li key={index}>{failure.name}：{failure.reason}</li>)}</ul>}
            </div>}
          </div>}
        <DialogFooter className="border-t pt-4"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>关闭</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
