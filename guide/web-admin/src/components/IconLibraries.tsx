import { useId, useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveIconLibraries, type IconLibraries } from "@/lib/icon-libraries"

export function IconLibrariesDialog({ config, onClose, onSaved }: { config: IconLibraries; onClose: () => void; onSaved: (config: IconLibraries) => void }) {
  const [draft, setDraft] = useState<IconLibraries>(() => ({ ...config, libraries: config.libraries.map(library => ({ ...library })) }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const writing = useRef(false)
  const prefix = useId()
  async function save() {
    if (writing.current) return
    writing.current = true
    setSaving(true)
    setError("")
    try { onSaved(await saveIconLibraries(draft)); onClose() }
    catch (error) { setError(`保存失败：${(error as Error).message}`) }
    finally { writing.current = false; setSaving(false) }
  }
  return <Dialog open onOpenChange={open => !open && !writing.current && onClose()}>
    <DialogContent className="sm:max-w-xl" showCloseButton={!saving}>
      <DialogHeader><DialogTitle>管理图标库</DialogTitle><DialogDescription>配置保存在服务器。由管理员浏览器直接读取 HTTPS JSON，来源需要允许跨域访问。</DialogDescription></DialogHeader>
      <fieldset disabled={saving} className="space-y-4">
        <div className="max-h-[45dvh] space-y-3 overflow-y-auto p-1">
          {draft.libraries.map((library, index) => <div key={library.id} data-library-editor className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">图标库 {index + 1}</span><Button type="button" variant="ghost" size="icon" aria-label={`删除图标库 ${library.name || index + 1}`} onClick={() => setDraft(current => {
              const libraries = current.libraries.filter(item => item.id !== library.id)
              return { libraries, activeId: current.activeId === library.id ? libraries[0]?.id ?? "" : current.activeId }
            })}><Trash2 /></Button></div>
            <Label htmlFor={`${prefix}-${library.id}-name`}>名称</Label><Input id={`${prefix}-${library.id}-name`} maxLength={100} value={library.name} onChange={event => setDraft(current => ({ ...current, libraries: current.libraries.map(item => item.id === library.id ? { ...item, name: event.target.value } : item) }))} />
            <Label htmlFor={`${prefix}-${library.id}-url`}>HTTPS JSON 地址</Label><Input id={`${prefix}-${library.id}-url`} maxLength={2048} placeholder="https://example.com/icons.json" value={library.url} onChange={event => setDraft(current => ({ ...current, libraries: current.libraries.map(item => item.id === library.id ? { ...item, url: event.target.value } : item) }))} />
          </div>)}
          {!draft.libraries.length && <p className="text-sm text-muted-foreground">还没有图标库，可以添加新的来源。</p>}
        </div>
        <Button type="button" size="sm" variant="outline" disabled={draft.libraries.length >= 20 || saving} onClick={() => setDraft(current => {
          // getRandomValues is also available on a Hub served over plain HTTP.
          const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("")
          const library = { id, name: "", url: "" }
          return { libraries: [...current.libraries, library], activeId: current.activeId || library.id }
        })}><Plus />添加图标库</Button>
        <p className="text-xs text-muted-foreground">最多 20 个来源；名称最多 100 字符，地址最多 2048 字符。只支持 name 和 icons（name、url）的 JSON 格式。</p>
        {!!draft.libraries.length && <div className="space-y-2"><Label htmlFor={`${prefix}-active`}>当前图标库</Label><Select value={draft.activeId} onValueChange={activeId => setDraft(current => ({ ...current, activeId }))} disabled={saving}><SelectTrigger id={`${prefix}-active`} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{draft.libraries.map((library, index) => <SelectItem key={library.id} value={library.id}>{library.name.trim() || `图标库 ${index + 1}`}</SelectItem>)}</SelectContent></Select></div>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter className="border-t pt-4"><Button type="button" variant="ghost" disabled={saving} onClick={onClose}>取消</Button><Button type="button" disabled={saving} onClick={() => void save()}>{saving ? "保存中…" : "保存图标库"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
