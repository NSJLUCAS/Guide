import { useId, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { normalizeCategory } from "@/lib/categories"

export function CategoryPicker({ id, value, options, onChange }: { id: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const listId = useId()
  const choose = (category: string) => { onChange(category); setOpen(false) }
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) { setQuery(""); setCreating(false); setError("") } }}>
    <PopoverTrigger asChild><Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} aria-controls={listId} className="w-full justify-between font-normal"><span className="truncate">{value.trim() || "未分类"}</span><ChevronsUpDown className="size-4 opacity-50" /></Button></PopoverTrigger>
    <PopoverContent align="start" className="space-y-2 p-3">
      <Input aria-label="搜索已有分类" placeholder="搜索已有分类" value={query} onChange={event => setQuery(event.target.value)} />
      <div id={listId} role="listbox" aria-label="已有分类" className="max-h-48 overflow-y-auto">
        {["", ...options.filter(option => option.toLowerCase().includes(query.trim().toLowerCase()))].map(option => <button type="button" role="option" aria-selected={value.trim() === option} key={option} onClick={() => choose(option)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-ring"><Check className={`size-4 shrink-0 ${value.trim() === option ? "" : "invisible"}`} /><span className="break-all">{option || "未分类"}</span></button>)}
      </div>
      <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => { setCreating(true); setName(query); setError("") }}><Plus />新建分类</Button>
      {creating && <div className="space-y-2 border-t pt-2"><Label htmlFor={`${id}-new`}>新分类名称</Label><Input id={`${id}-new`} maxLength={100} value={name} onChange={event => setName(event.target.value)} /><p className="text-xs text-muted-foreground">保存当前服务后，其他服务即可选择此分类。</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<Button type="button" size="sm" onClick={() => { try { const category = normalizeCategory(name); if (!category) throw new Error("请填写新分类名称"); choose(category) } catch (error) { setError((error as Error).message) } }}>创建并选择</Button></div>}
    </PopoverContent>
  </Popover>
}
