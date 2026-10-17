import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ListChecks, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CategoryBatch } from "@/components/CategoryBatch"
import { DragGrip, dragRowClass, useRowDrag, type DropPlace } from "@/components/RowDrag"
import { dropService } from "@/lib/api"
import { categoryApi, categoryName, categoriesChanged, type Category } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function CategoryForm({ category, onClose, onSave }: { category: Partial<Category>; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState(category.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submitting = useRef(false)
  const id = useId()
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (submitting.current) return
    let normalized: string
    try { normalized = categoryName(name) } catch (error) { setError((error as Error).message); return }
    submitting.current = true; setSaving(true); setError("")
    try { await onSave(normalized) } catch (error) { setError((error as Error).message) }
    finally { submitting.current = false; setSaving(false) }
  }
  return <Dialog open onOpenChange={open => !open && !submitting.current && onClose()}>
    <DialogContent showCloseButton={!saving}><DialogHeader><DialogTitle>{category.id === undefined ? "新增分类" : "编辑分类"}</DialogTitle><DialogDescription>分类按列表顺序显示在导航栏，支持暂时没有网站的分类。</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><Label htmlFor={id}>分类名称</Label><Input id={id} required maxLength={100} value={name} disabled={saving} onChange={event => setName(event.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">保存失败：{error}</p>}
        <DialogFooter><Button type="button" variant="ghost" disabled={saving} onClick={onClose}>取消</Button><Button type="submit" disabled={saving}>{saving ? "保存中…" : "保存"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}

export function Categories() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [operationError, setOperationError] = useState("")
  const [busy, setBusy] = useState("")
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState("")
  /** The category whose services the batch dialog is changing. */
  const [batching, setBatching] = useState<string | null>(null)
  const writing = useRef(false)
  const generation = useRef(0)
  const load = useCallback(async (signal?: AbortSignal) => {
    const current = ++generation.current
    setLoading(true); setLoadError("")
    try { const rows = await categoryApi.list(signal); if (current === generation.current && !signal?.aborted) setCategories(rows) }
    catch (error) { if (current === generation.current && !signal?.aborted) setLoadError((error as Error).message) }
    finally { if (current === generation.current && !signal?.aborted) setLoading(false) }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => { if (!controller.signal.aborted) return load(controller.signal) })
    return () => controller.abort()
  }, [load])
  const locked = loading || !!busy || !!loadError

  async function save(name: string) {
    if (writing.current) return
    writing.current = true; setBusy("save"); setOperationError("")
    try {
      if (editing?.id === undefined) await categoryApi.create(name)
      else await categoryApi.update(editing.id, name)
      setEditing(null); categoriesChanged(); toast.success("分类已保存"); await load()
    } finally { writing.current = false; setBusy("") }
  }
  const drag = useRowDrag((dragged, target, place) => void reorder(dragged, target, place), locked)
  async function reorder(dragged: number, target: number, place: DropPlace) {
    if (!categories || locked || writing.current) return
    const next = dropService(categories, dragged, target, place)
    if (next.every((category, i) => category.id === categories[i].id)) return
    writing.current = true; setBusy("order"); setOperationError("")
    // Shown at once; the reload below puts the server's order back if the write is refused.
    setCategories(next)
    try { await categoryApi.order(next.map(category => category.id)); categoriesChanged(); toast.success("分类顺序已保存") }
    catch (error) { setOperationError(`排序失败：${(error as Error).message}`) }
    finally { await load(); writing.current = false; setBusy("") }
  }
  async function remove() {
    if (!deleting || writing.current) return
    writing.current = true; setBusy("delete"); setDeleteError("")
    try { await categoryApi.remove(deleting.id); setDeleting(null); categoriesChanged(); toast.success("分类已删除"); await load() }
    catch (error) { setDeleteError((error as Error).message) }
    finally { writing.current = false; setBusy("") }
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><div className="mr-auto"><h2 className="font-semibold">分类</h2><p className="text-xs text-muted-foreground">管理导航分类及显示顺序</p></div><Button variant="outline" size="sm" disabled={loading || !!busy} onClick={() => { setOperationError(""); void load() }}><RefreshCw />刷新列表</Button><Button size="sm" disabled={locked} onClick={() => setEditing({})}><Plus />新增分类</Button></div>
    {(loadError || operationError) && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><p>{loadError ? `加载失败：${loadError}` : operationError}</p>{loadError && <Button variant="outline" size="sm" disabled={loading || !!busy} onClick={() => void load()}>重试</Button>}</div>}
    {loading && <div role="status" className="text-sm text-muted-foreground">加载分类中…{categories === null && <Skeleton className="mt-2 h-24" />}</div>}
    {categories?.length ? <Card className="overflow-hidden p-0"><Table aria-label="分类列表"><TableHeader><TableRow><TableHead className="w-8"><span className="sr-only">拖动</span></TableHead><TableHead>分类名称</TableHead><TableHead>网站数量</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>
      {categories.map((category, index) => <TableRow key={category.id} data-category-id={category.id} {...drag.row(category.id)} className={`${dragRowClass} [&>td]:py-1`}>
        <TableCell className="w-8 pr-0"><DragGrip label={`拖动排序分类 ${category.name}`} disabled={locked} {...drag.grip(category.id)} /></TableCell>
        <TableCell className="w-full max-w-0 truncate font-medium" title={category.name}>{category.name}</TableCell><TableCell className="tnum text-muted-foreground">{category.count}</TableCell>
        <TableCell><div className="flex justify-end">
          <Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label={`上移分类 ${category.name}`} disabled={locked || index === 0} onClick={() => void reorder(category.id, categories[index - 1].id, "before")}><ArrowUp /></Button>
          <Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label={`下移分类 ${category.name}`} disabled={locked || index === categories.length - 1} onClick={() => void reorder(category.id, categories[index + 1].id, "after")}><ArrowDown /></Button>
          <Button size="icon-sm" variant="ghost" aria-label={`批量操作分类 ${category.name}`} title="批量公开、私有或更新图标" disabled={locked || category.count === 0} onClick={() => setBatching(category.name)}><ListChecks /></Button>
          <Button size="icon-sm" variant="ghost" aria-label={`编辑分类 ${category.name}`} disabled={locked} onClick={() => setEditing(category)}><Pencil /></Button>
          <Button size="icon-sm" variant="ghost" aria-label={`删除分类 ${category.name}`} disabled={locked} onClick={() => { setDeleteError(""); setDeleting(category) }}><Trash2 /></Button>
        </div></TableCell>
      </TableRow>)}
    </TableBody></Table></Card> : !loading && !loadError && <Card className="p-6 text-center text-sm text-muted-foreground">还没有分类，点击“新增分类”开始添加。</Card>}
    {batching !== null && <CategoryBatch category={batching} onClose={() => setBatching(null)} />}
    {editing && <CategoryForm category={editing} onClose={() => !writing.current && setEditing(null)} onSave={save} />}
    {deleting && <Dialog open onOpenChange={open => !open && !writing.current && setDeleting(null)}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>删除分类</DialogTitle><DialogDescription>{deleting.count > 0 ? `“${deleting.name}”关联 ${deleting.count} 个网站，请先在服务页迁移关联网站。` : `确认删除空分类“${deleting.name}”？`}</DialogDescription></DialogHeader>{deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}<DialogFooter><Button variant="ghost" disabled={!!busy} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={!!busy || deleting.count > 0} onClick={() => void remove()}>{busy === "delete" ? "删除中…" : "确认删除"}</Button></DialogFooter></DialogContent></Dialog>}
  </div>
}
