import { useEffect, useId, useRef, useState } from "react"
import { Globe, Image } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { filterIcons, loadIconCatalog, type CatalogIcon } from "@/lib/icons"
import { loadIconLibraries, saveIconLibraries, type IconLibraries, type IconLibrary } from "@/lib/icon-libraries"
import { IconLibrariesDialog } from "@/components/IconLibraries"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function IconImage({ url, large = false }: { url: string; large?: boolean }) {
  const [failed, setFailed] = useState(false)
  const className = large ? "size-16 shrink-0 object-contain" : "size-9 shrink-0 object-contain"
  return failed ? <Globe role="img" aria-label="图标不可用" className={className + " text-muted-foreground"} /> : (
    <img src={url} alt="" className={className} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  )
}

function CatalogResults({ library, disabled, onClose, onSelect }: { library: IconLibrary; disabled: boolean; onClose: () => void; onSelect: (url: string) => void }) {
  const [icons, setIcons] = useState<CatalogIcon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(80)
  const [selected, setSelected] = useState<CatalogIcon | null>(null)
  const searchId = useId()

  useEffect(() => {
    let active = true
    loadIconCatalog(library.url).then(next => {
      if (active) { setIcons(next); setLoading(false) }
    }).catch((error: Error) => {
      if (active) { setError(error.message || "无法加载图标库，请检查网络后重试"); setLoading(false) }
    })
    return () => { active = false }
  }, [attempt, library.url])

  const matches = filterIcons(icons, query)
  return (
    <>
        <div className="space-y-2">
          <Label htmlFor={searchId}>搜索图标</Label>
          <Input id={searchId} placeholder="例如 Emby、GitHub" value={query} onChange={event => { setQuery(event.target.value); setLimit(80) }} />
        </div>
        {loading && <p role="status" className="text-sm text-muted-foreground">加载图标库中…</p>}
        {error && <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error}</p><p className="text-muted-foreground">也可以取消后手动填写图标地址。</p><Button type="button" size="sm" variant="outline" onClick={() => { setError(""); setLoading(true); setAttempt(value => value + 1) }}>重试</Button></div>}
        {!loading && !error && <>
          <p role="status" className="text-xs text-muted-foreground">{matches.length ? `找到 ${matches.length} 个图标，显示 ${Math.min(limit, matches.length)} 个` : "没有找到匹配的图标"}</p>
          <div className="max-h-[40dvh] overflow-y-auto p-1">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {matches.slice(0, limit).map(icon => (
                <button key={icon.url} type="button" data-catalog-icon aria-label={icon.name} aria-pressed={selected?.url === icon.url} title={icon.name}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring ${selected?.url === icon.url ? "border-primary bg-accent" : "border-border"}`}
                  onClick={() => setSelected(icon)}>
                  <IconImage url={icon.url} /><span className="w-full truncate text-center">{icon.name}</span>
                </button>
              ))}
            </div>
          </div>
          {matches.length > limit && <Button type="button" variant="outline" size="sm" onClick={() => setLimit(value => value + 80)}>加载更多</Button>}
        </>}
        {selected && <div className="flex min-w-0 items-center gap-3 rounded-md border p-3">
          <IconImage key={selected.url} url={selected.url} large />
          <div className="min-w-0"><p className="text-sm font-medium">{selected.name}</p><p className="break-all text-xs text-muted-foreground">{selected.url}</p></div>
        </div>}
        <div className="min-w-0 space-y-1 text-xs text-muted-foreground"><p>当前图标库：{library.name}</p><p className="break-all">来源：<a href={library.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{library.url}</a></p></div>
        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="ghost" disabled={disabled} onClick={onClose}>取消</Button>
          <Button type="button" disabled={disabled || !selected} onClick={() => { if (selected) { onSelect(selected.url); onClose() } }}>使用此图标</Button>
        </DialogFooter>
    </>
  )
}

function CatalogDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (url: string) => void }) {
  const [config, setConfig] = useState<IconLibraries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [managing, setManaging] = useState(false)
  const [switching, setSwitching] = useState(false)
  const writing = useRef(false)
  const sourceId = useId()
  useEffect(() => {
    let active = true
    loadIconLibraries().then(next => { if (active) { setConfig(next); setLoading(false) } }).catch((error: Error) => { if (active) { setError(error.message); setLoading(false) } })
    return () => { active = false }
  }, [attempt])
  async function switchSource(activeId: string) {
    if (!config || writing.current || activeId === config.activeId) return
    writing.current = true
    setSwitching(true)
    setError("")
    try { setConfig(await saveIconLibraries({ ...config, activeId })) }
    catch (error) { setError(`切换失败：${(error as Error).message}`) }
    finally { writing.current = false; setSwitching(false) }
  }
  const library = config?.libraries.find(item => item.id === config.activeId)
  return <Dialog open onOpenChange={open => !open && !writing.current && onClose()}>
    <DialogContent className="sm:max-w-2xl" showCloseButton={!switching}>
      <DialogHeader><DialogTitle>选择图标</DialogTitle><DialogDescription>搜索并预览图标，确认后填入服务表单。</DialogDescription></DialogHeader>
      {loading && <p role="status" className="text-sm text-muted-foreground">加载图标库配置中…</p>}
      {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p>{!config && <Button type="button" size="sm" variant="outline" onClick={() => { setError(""); setLoading(true); setAttempt(value => value + 1) }}>重试</Button>}</div>}
      {config && <div className="flex flex-wrap items-center gap-2"><Label htmlFor={sourceId}>图标库</Label>{library && <Select value={config.activeId} disabled={switching} onValueChange={activeId => void switchSource(activeId)}><SelectTrigger id={sourceId} className="min-w-0 flex-1"><SelectValue /></SelectTrigger><SelectContent>{config.libraries.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>}<Button type="button" variant="outline" size="sm" disabled={switching} onClick={() => setManaging(true)}>管理</Button></div>}
      {switching && <p role="status" className="text-xs text-muted-foreground">正在保存当前图标库…</p>}
      {library && <CatalogResults key={`${library.id}:${library.url}`} library={library} disabled={switching} onClose={onClose} onSelect={onSelect} />}
      {!loading && !library && <><p className="text-sm text-muted-foreground">{config ? "还没有图标库，请先添加来源。" : "也可以取消后手动填写图标地址。"}</p><DialogFooter><Button type="button" variant="ghost" onClick={onClose}>取消</Button></DialogFooter></>}
      {managing && config && <IconLibrariesDialog config={config} onClose={() => setManaging(false)} onSaved={next => { setConfig(next); setError("") }} />}
    </DialogContent>
  </Dialog>
}

export function IconPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  return <>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Image />选择图标</Button>
    {open && <CatalogDialog onClose={() => setOpen(false)} onSelect={onSelect} />}
  </>
}
