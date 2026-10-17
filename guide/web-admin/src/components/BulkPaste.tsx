import { useEffect, useId, useState } from "react"
import { LoaderCircle } from "lucide-react"

import { CategoryPicker } from "@/components/CategoryPicker"
import { ServiceIconPreview } from "@/components/ServiceIconPreview"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { serviceApi, serviceValues, type Service } from "@/lib/api"
import { eachLimited, knownLinks, linkHost, parsePastedLinks } from "@/lib/bulk-paste"
import { normalizeCategory } from "@/lib/categories"
import { discoverServicePage } from "@/lib/service-icons"

type Row = {
  url: string
  name: string
  /** The administrator typed a name: a title arriving later must not replace it. */
  renamed: boolean
  icon: string | null
  category: string
  /** Already configured: listed so nothing vanishes, but never added again. */
  exists: boolean
  selected: boolean
  fetching: boolean
  note: string
  error: string
  saved: boolean
}

/** Pages are read four at a time: each read may take the hub's full five seconds. */
const READS = 4

type Recognized = { rows: Row[]; rejected: string[]; error: "" } | { rows: null; rejected: string[]; error: string }

function recognize(value: string, services: readonly Service[]): Recognized {
  const { links, rejected } = parsePastedLinks(value)
  if (!links.length) return { rows: null, rejected, error: rejected.length ? "没有识别到 HTTP / HTTPS 网址" : "请先粘贴网址，每行一个" }
  const known = knownLinks(services)
  return { rejected, error: "", rows: links.map(({ url, title }): Row => {
    const exists = known.has(url)
    return { url, name: title || linkHost(url), renamed: false, icon: null, category: "", exists, selected: !exists, fetching: !exists, note: "", error: "", saved: false }
  }) }
}

function patchRow(rows: Row[] | null, url: string, change: (row: Row) => Partial<Row>): Row[] | null {
  return rows?.map(row => row.url === url ? { ...row, ...change(row) } : row) ?? null
}

/** The rows still waiting for their page to be read. */
const unread = (rows: Row[] | null) => rows?.filter(row => row.fetching).map(row => row.url) ?? []

export function BulkPaste({ text, services, categories, onClose, onAdded }: {
  text: string
  services: Service[]
  categories: string[]
  onClose: () => void
  onAdded: (count: number) => Promise<void>
}) {
  // A Ctrl+V on the page opens straight onto the list.
  const [opening] = useState(() => text.trim() ? recognize(text, services) : null)
  const [draft, setDraft] = useState(text)
  const [rows, setRows] = useState<Row[] | null>(opening?.rows ?? null)
  const [rejected, setRejected] = useState<string[]>(opening?.rejected ?? [])
  const [inputError, setInputError] = useState(opening?.error ?? "")
  const [reads, setReads] = useState<string[]>(() => unread(opening?.rows ?? null))
  const [allCategory, setAllCategory] = useState("")
  const [isPublic, setPublic] = useState(serviceValues().public)
  const [checkEnabled, setCheckEnabled] = useState(serviceValues().checkEnabled)
  const [saving, setSaving] = useState(false)
  const prefix = useId()

  const patch = (url: string, change: (row: Row) => Partial<Row>) => setRows(current => patchRow(current, url, change))

  // Each recognized list is read once; going back to edit, or closing, aborts
  // what is still in flight, and so does StrictMode's rehearsal before the real run.
  useEffect(() => {
    if (!reads.length) return
    const controller = new AbortController()
    void eachLimited(reads, READS, async url => {
      if (controller.signal.aborted) return
      try {
        const page = await discoverServicePage(url, controller.signal)
        if (controller.signal.aborted) return
        setRows(current => patchRow(current, url, row => ({
          fetching: false,
          name: page.title && !row.renamed ? page.title : row.name,
          icon: page.icons[0]?.url ?? null,
          note: page.title ? "" : row.name === linkHost(url) ? "网页没有标题，已用域名" : "网页没有标题",
        })))
      } catch {
        if (controller.signal.aborted) return
        setRows(current => patchRow(current, url, row => ({ fetching: false, note: row.name === linkHost(url) ? "无法读取网页，已用域名，图标留空" : "无法读取网页，图标留空" })))
      }
    })
    return () => controller.abort()
  }, [reads])

  function submit() {
    const result = recognize(draft, services)
    setInputError(result.error)
    if (!result.rows) return
    setRejected(result.rejected)
    setRows(result.rows)
    setReads(unread(result.rows))
  }

  function edit() {
    setReads([])
    setRows(null)
  }

  const pending = rows?.filter(row => row.selected && !row.exists && !row.saved) ?? []
  const fetching = rows?.some(row => row.fetching) ?? false
  const choices = [...new Set([...categories, ...(rows ?? []).map(row => row.category).filter(Boolean)])]

  async function save() {
    if (saving || !pending.length) return
    const blank = pending.filter(row => !row.name.trim())
    if (blank.length) { blank.forEach(row => patch(row.url, () => ({ error: "请填写网站名称" }))); return }
    setSaving(true)
    let sort = Math.max(-1, ...services.map(service => service.sort)) + 1
    let added = 0
    for (const row of pending) {
      try {
        await serviceApi.create({ ...serviceValues(), name: row.name.trim(), url: row.url, icon: row.icon, category: normalizeCategory(row.category), sort: sort++, public: isPublic, checkEnabled })
        patch(row.url, () => ({ saved: true, selected: false, error: "" }))
        added++
      } catch (error) {
        patch(row.url, () => ({ error: (error as Error).message }))
      }
    }
    setSaving(false)
    if (added) await onAdded(added)
    if (added === pending.length) onClose()
  }

  const fresh = rows?.filter(row => !row.exists).length ?? 0
  const skipped = (rows?.length ?? 0) - fresh
  return (
    <Dialog open onOpenChange={open => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-3xl" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>批量粘贴网站</DialogTitle>
          <DialogDescription>每行一个网址。会自动读取网页标题作为名称、选用第一个图标；已存在的网址自动跳过。</DialogDescription>
        </DialogHeader>
        {rows === null ? (
          <div className="space-y-2">
            <textarea aria-label="网址列表" autoFocus value={draft} onChange={event => { setDraft(event.target.value); setInputError("") }}
              placeholder={"https://www.fut.gg/\nhttps://www.futbin.com/"}
              className="min-h-48 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30" />
            {inputError && <p role="alert" className="text-sm text-destructive">{inputError}</p>}
            <p className="text-xs text-muted-foreground">在浏览器里复制全部标签页后粘贴到这里；也可以在服务页直接按 Ctrl+V。</p>
          </div>
        ) : (
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <p className="mr-auto text-muted-foreground">新增 {fresh} 个{skipped > 0 && ` · 已存在 ${skipped} 个（跳过）`}</p>
              <div className="flex items-center gap-2"><Label htmlFor={`${prefix}-all`} className="shrink-0">全部设为</Label><div className="w-36"><CategoryPicker id={`${prefix}-all`} value={allCategory} options={choices}
                onChange={category => { setAllCategory(category); setRows(current => current?.map(row => row.exists || row.saved ? row : { ...row, category }) ?? null) }} /></div></div>
              <div className="flex items-center gap-2"><Switch id={`${prefix}-public`} checked={isPublic} disabled={saving} onCheckedChange={setPublic} /><Label htmlFor={`${prefix}-public`}>公开</Label></div>
              <div className="flex items-center gap-2"><Switch id={`${prefix}-check`} checked={checkEnabled} disabled={saving} onCheckedChange={setCheckEnabled} /><Label htmlFor={`${prefix}-check`}>在线检测</Label></div>
            </div>
            <ul aria-label="待添加网站" className="max-h-[50vh] divide-y overflow-y-auto rounded-md border px-3">
              {rows.map((row, index) => {
                const host = linkHost(row.url)
                const locked = row.exists || row.saved || saving
                return (
                  <li key={row.url} data-paste-row={row.url} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <input type="checkbox" aria-label={`添加 ${host}`} className="size-4 accent-primary" checked={row.selected} disabled={locked}
                      onChange={event => patch(row.url, () => ({ selected: event.target.checked }))} />
                    {row.fetching ? <LoaderCircle role="img" aria-label="正在读取网页" className="size-6 shrink-0 animate-spin text-muted-foreground" /> : <ServiceIconPreview icon={row.icon} />}
                    <div className={`min-w-0 flex-1 basis-48 ${row.exists || row.saved ? "opacity-60" : ""}`}>
                      <Input aria-label={`${host} 的名称`} className="h-8" maxLength={100} value={row.name} disabled={locked}
                        onChange={event => patch(row.url, () => ({ name: event.target.value, renamed: true, error: "" }))} />
                      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={row.url}>{row.url}</p>
                    </div>
                    <div className="w-36 shrink-0">
                      {row.exists ? <p className="text-xs text-muted-foreground">已存在，跳过</p>
                        : row.saved ? <p className="text-xs text-muted-foreground">已添加</p>
                        : <CategoryPicker id={`${prefix}-${index}`} value={row.category} options={choices} onChange={category => patch(row.url, () => ({ category }))} />}
                    </div>
                    {(row.error || row.note) && !row.saved && <p role={row.error ? "alert" : undefined} className={`w-full pl-7 text-xs ${row.error ? "text-destructive" : "text-muted-foreground"}`}>{row.error ? `添加失败：${row.error}` : row.note}</p>}
                  </li>
                )
              })}
            </ul>
            {rejected.length > 0 && <details className="text-xs text-muted-foreground"><summary>{rejected.length} 行不是有效网址，已忽略</summary><ul className="mt-1 space-y-0.5 break-all">{rejected.map((line, index) => <li key={index}>{line}</li>)}</ul></details>}
          </div>
        )}
        <DialogFooter className="border-t pt-4">
          {rows !== null && <Button type="button" variant="ghost" className="sm:mr-auto" disabled={saving} onClick={edit}>返回修改</Button>}
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>取消</Button>
          {rows === null
            ? <Button type="button" onClick={submit}>识别网址</Button>
            : <Button type="button" disabled={saving || fetching || !pending.length} onClick={() => void save()}>
                {saving ? "添加中…" : fetching ? "正在读取网页…" : `添加 ${pending.length} 个网站`}
              </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
