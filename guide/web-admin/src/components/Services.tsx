import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DragGrip, dragRowClass, useRowDrag, type DropPlace } from "@/components/RowDrag"
import { IconPicker } from "@/components/IconPicker"
import { WebsiteIcon } from "@/components/WebsiteIcon"
import { CategoryPicker } from "@/components/CategoryPicker"
import { ServiceIconPreview } from "@/components/ServiceIconPreview"
import { categoriesChanged, getServiceData, categoryOptions, normalizeCategory } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dropService, serviceApi, serviceValues, type Service, type ServiceInput } from "@/lib/api"
import { filterAdminServices, serviceHost, serviceTabs } from "@/lib/service-list"
import { validateIconInput } from "@/lib/icons"

function ServiceForm({ service, categories, onClose, onSave }: {
  service: Partial<Service>
  categories: string[]
  onClose: () => void
  onSave: (values: ServiceInput) => Promise<void>
}) {
  const [values, setValues] = useState(() => serviceValues(service))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submitting = useRef(false)
  const prefix = useId()
  const id = (field: string) => `${prefix}-${field}`

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (submitting.current) return
    const next = { ...values, name: values.name.trim(), url: values.url.trim(), icon: values.icon?.trim() || null }
    if (!next.name) return setError("请填写网站名称")
    try {
      const url = new URL(next.url)
      if (!/^https?:\/\/[^/?#]+/i.test(next.url) || !["http:", "https:"].includes(url.protocol)
        || !url.hostname || url.username || url.password) throw new Error("invalid URL")
    } catch { return setError("请填写不含用户名和密码的 HTTP / HTTPS 地址") }
    try { next.icon = validateIconInput(values.icon) }
    catch (error) { return setError((error as Error).message) }
    try { next.category = normalizeCategory(values.category) }
    catch (error) { return setError((error as Error).message) }
    submitting.current = true
    setSaving(true)
    setError("")
    try { await onSave(next) }
    catch (e) { setError((e as Error).message) }
    finally { submitting.current = false; setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting.current && onClose()}>
      <DialogContent showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>{service.id === undefined ? "添加服务" : "编辑服务"}</DialogTitle>
          <DialogDescription>配置导航网站；排序在列表中拖动手柄或上移、下移调整。</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={saving} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={id("name")}>名称</Label>
              <Input id={id("name")} required maxLength={100} value={values.name} onChange={e => setValues({ ...values, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("url")}>URL</Label>
              <Input id={id("url")} type="url" required maxLength={2048} placeholder="https://example.com" value={values.url} onChange={e => setValues({ ...values, url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("description")}>简介</Label>
              <Input id={id("description")} maxLength={2000} value={values.description} onChange={e => setValues({ ...values, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("icon")}>图标</Label>
              <div className="flex flex-wrap gap-2"><IconPicker onSelect={icon => setValues(current => ({ ...current, icon }))} /><WebsiteIcon url={values.url} onSelect={icon => setValues(current => ({ ...current, icon }))} /></div>
              <Input id={id("icon")} maxLength={2048} placeholder="HTTPS 图标地址，或 emby、github" aria-describedby={id("icon-help")} value={values.icon ?? ""} onChange={e => setValues({ ...values, icon: e.target.value })} />
              <p id={id("icon-help")} className="text-xs text-muted-foreground">也可手动填写不含登录凭据的 HTTPS 地址或品牌名称；留空使用默认图标。</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("category")}>分类</Label>
              <CategoryPicker id={id("category")} value={values.category} options={categories} onChange={category => setValues({ ...values, category })} />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2"><Switch id={id("public")} checked={values.public} onCheckedChange={publicValue => setValues({ ...values, public: publicValue })} /><Label htmlFor={id("public")}>公开</Label></div>
              <div className="flex items-center gap-2"><Switch id={id("enabled")} checked={values.enabled} onCheckedChange={enabled => setValues({ ...values, enabled })} /><Label htmlFor={id("enabled")}>启用</Label></div>
              <div className="flex items-center gap-2"><Switch id={id("checkEnabled")} checked={values.checkEnabled} onCheckedChange={checkEnabled => setValues({ ...values, checkEnabled })} /><Label htmlFor={id("checkEnabled")}>在线检测</Label></div>
            </div>
            <p className="text-xs text-muted-foreground">关闭在线检测后，服务仍可展示，公开页面不显示在线状态。</p>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">保存失败：{error}</p>}
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>取消</Button>
            <Button type="submit" disabled={saving}>{saving ? "保存中…" : "保存"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function Services() {
  const [services, setServices] = useState<Service[] | null>(null)
  const [managedCategories, setManagedCategories] = useState<string[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [operationError, setOperationError] = useState("")
  const [busy, setBusy] = useState("")
  const writing = useRef(false)
  const generation = useRef(0)
  const [editing, setEditing] = useState<Partial<Service> | null>(null)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [deleteError, setDeleteError] = useState("")

  const load = useCallback(async (signal?: AbortSignal) => {
    const current = ++generation.current
    setLoading(true)
    setLoadError("")
    try {
      const { services: list, managedCategories: categories } = await getServiceData(signal)
      if (current === generation.current && !signal?.aborted) { setServices(list); setManagedCategories(categories) }
    } catch (e) {
      if (current === generation.current && !signal?.aborted && (e as Error).name !== "AbortError") setLoadError((e as Error).message)
    } finally {
      if (current === generation.current && !signal?.aborted) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    // Defer initial synchronization; StrictMode can cancel its first effect
    // before the request starts, without producing a redundant load or render.
    void Promise.resolve().then(() => { if (!controller.signal.aborted) return load(controller.signal) })
    return () => controller.abort()
  }, [load])

  // No writes from a stale list after a failed read, or while another write is in flight.
  const locked = loading || !!busy || !!loadError
  const [filter, setFilter] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const tabs = serviceTabs(services ?? [], managedCategories)
  const current = filter === null || tabs.some(tab => tab.value === filter) ? filter : null
  const visible = filterAdminServices(services ?? [], current, query)
  const drag = useRowDrag((dragged, target, place) => void reorder(dragged, target, place), locked)

  async function save(values: ServiceInput) {
    if (writing.current) return
    writing.current = true
    setBusy("save")
    setOperationError("")
    try {
      if (editing?.id === undefined) await serviceApi.create(values)
      else await serviceApi.update(editing.id, values)
      setEditing(null)
      categoriesChanged()
      toast.success("服务已保存")
      // A failed refresh is a list error, not a failed save: avoid inviting duplicates.
      await load()
    } finally { writing.current = false; setBusy("") }
  }

  async function remove() {
    if (!deleting || writing.current) return
    writing.current = true
    setBusy("delete")
    setDeleteError("")
    try {
      await serviceApi.remove(deleting.id)
      setDeleting(null)
      toast.success("导航服务配置已删除")
      await load()
    } catch (e) { setDeleteError((e as Error).message) }
    finally { writing.current = false; setBusy("") }
  }

  async function reorder(dragged: number, target: number, place: DropPlace) {
    if (!services || locked || writing.current) return
    const next = dropService(services, dragged, target, place)
    if (next.every((service, i) => service.id === services[i].id)) return
    writing.current = true
    setBusy("order")
    setOperationError("")
    // Shown at once; the reload below puts the server's order back if the write is refused.
    setServices(next)
    try {
      await serviceApi.order(next.map(service => service.id))
      toast.success("排序已保存")
    } catch (e) { setOperationError(`排序失败：${(e as Error).message}`) }
    finally {
      // Re-read even on refusal: another tab may have changed the complete ID list.
      await load()
      writing.current = false
      setBusy("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto"><h2 className="font-semibold">服务</h2><p className="text-xs text-muted-foreground">管理导航网站配置</p></div>
        <Button variant="outline" size="sm" disabled={loading || !!busy} onClick={() => { setOperationError(""); void load() }}><RefreshCw /> 刷新列表</Button>
        <Button size="sm" disabled={locked} onClick={() => setEditing({ sort: Math.max(-1, ...(services ?? []).map(s => s.sort)) + 1 })}><Plus /> 添加服务</Button>
      </div>
      {(loadError || operationError) && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <p>{loadError ? `加载失败：${loadError}` : operationError}</p>
          {loadError && <Button variant="outline" size="sm" disabled={loading || !!busy} onClick={() => { setOperationError(""); void load() }}>重试</Button>}
        </div>
      )}
      {loading && <div role="status" className="space-y-2"><p className="text-sm text-muted-foreground">加载服务中…</p>{services === null && <Skeleton className="h-32" />}</div>}
      {busy === "order" && <p role="status" className="text-sm text-muted-foreground">正在保存排序…</p>}
      {services?.length ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div role="group" aria-label="服务分类" className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 pb-1">
              {[{ value: null, label: "全部", count: services.length }, ...tabs].map(({ value, label, count }) => (
                <Button key={value === null ? "*" : `=${value}`} size="sm" variant={current === value ? "secondary" : "ghost"} aria-pressed={current === value}
                  className="shrink-0" onClick={() => setFilter(value)}>
                  {label}<span className="tnum text-muted-foreground">{count}</span>
                </Button>
              ))}
            </div>
            <div role="search" className="relative w-full shrink-0 sm:w-56">
              <Search aria-hidden className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
              <Input type="search" aria-label="搜索服务" placeholder="搜索名称、地址或简介" value={query} onChange={e => setQuery(e.target.value)} className="h-8 pl-8" />
            </div>
          </div>
          <Card className="overflow-hidden p-0">
            <Table aria-label="服务列表">
              <TableHeader><TableRow><TableHead className="w-8"><span className="sr-only">拖动</span></TableHead><TableHead>网站</TableHead><TableHead>分类</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {visible.map((service, index) => (
                  <TableRow key={service.id} data-service-id={service.id} {...drag.row(service.id)} className={`${dragRowClass} [&>td]:py-1`}>
                    <TableCell className="w-8 pr-0"><DragGrip label={`拖动排序 ${service.name}`} disabled={locked} {...drag.grip(service.id)} /></TableCell>
                    <TableCell className="w-full max-w-0" title={service.description ? `${service.url}\n${service.description}` : service.url}>
                      <div className="flex min-w-0 items-center gap-2">
                        <ServiceIconPreview icon={service.icon} />
                        <span className="truncate font-medium">{service.name}</span>
                        <span className="hidden truncate text-xs text-muted-foreground md:inline">{serviceHost(service.url)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground" title={service.category || "未分类"}>{service.category || "未分类"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className={service.public ? undefined : "font-medium text-foreground"}>{service.public ? "公开" : "私有"}</span>
                      {" · "}
                      <span className={service.enabled ? undefined : "font-medium text-foreground"}>{service.enabled ? "启用" : "停用"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label={`上移 ${service.name}`} disabled={locked || index === 0} onClick={() => void reorder(service.id, visible[index - 1].id, "before")}><ArrowUp /></Button>
                        <Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label={`下移 ${service.name}`} disabled={locked || index === visible.length - 1} onClick={() => void reorder(service.id, visible[index + 1].id, "after")}><ArrowDown /></Button>
                        <Button size="icon-sm" variant="ghost" aria-label={`编辑 ${service.name}`} disabled={locked} onClick={() => setEditing(service)}><Pencil /></Button>
                        <Button size="icon-sm" variant="ghost" aria-label={`删除 ${service.name}`} disabled={locked} onClick={() => { setDeleteError(""); setDeleting(service) }}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">没有匹配的服务</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          <p className="text-xs text-muted-foreground">拖动左侧手柄调整顺序，松手即保存；鼠标停在网站上可查看完整地址和简介。</p>
        </>
      ) : !loading && !loadError && services !== null ? (
        <Card className="p-6 text-center text-sm text-muted-foreground"><p>还没有服务</p><p className="mt-1">点击“添加服务”配置第一个网站。</p></Card>
      ) : null}
      {editing && <ServiceForm service={editing} categories={categoryOptions(services ?? [], managedCategories)} onClose={() => !writing.current && setEditing(null)} onSave={save} />}
      {deleting && (
        <Dialog open onOpenChange={open => !open && !writing.current && setDeleting(null)}>
          <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
            <DialogHeader><DialogTitle>删除「{deleting.name}」？</DialogTitle><DialogDescription>将删除此网站的导航服务配置，不会删除网站本身或原监控节点。</DialogDescription></DialogHeader>
            {deleteError && <p role="alert" className="text-sm text-destructive">删除失败：{deleteError}</p>}
            <DialogFooter className="border-t pt-4"><Button variant="ghost" disabled={!!busy} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={!!busy} onClick={() => void remove()}>{busy ? "删除中…" : "删除"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
