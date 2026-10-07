import { useEffect, useId, useState } from "react"
import { Globe, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { discoverServiceIcons, type DiscoveredIcon } from "@/lib/service-icons"

function Preview({url}:{url:string}) {
  const [failed,setFailed]=useState(false)
  return failed?<Globe aria-label="图标不可用" role="img" className="size-8 shrink-0 text-muted-foreground" />:<img src={url} alt="" className="size-8 shrink-0 object-contain" referrerPolicy="no-referrer" onError={()=>setFailed(true)} />
}
function Candidates({url,onSelect,onClose}:{url:string;onSelect:(url:string)=>void;onClose:()=>void}) {
  const [icons,setIcons]=useState<DiscoveredIcon[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [attempt,setAttempt]=useState(0)
  const [selected,setSelected]=useState<string | null>(null)
  useEffect(()=>{
    const controller=new AbortController()
    discoverServiceIcons(url,controller.signal).then(icons=>{if(!controller.signal.aborted){setIcons(icons);setLoading(false)}}).catch((error:Error)=>{if(!controller.signal.aborted){setError(error.message);setLoading(false)}})
    return()=>controller.abort()
  },[url,attempt])
  return <Dialog open onOpenChange={open=>!open&&onClose()}><DialogContent><DialogHeader><DialogTitle>获取网站图标</DialogTitle><DialogDescription>由 Hub 安全读取当前网站，选择后仅填入图标字段，仍需保存服务。favicon.ico 为候选地址，图片是否可用以预览为准。</DialogDescription></DialogHeader>
    {loading&&<p role="status" className="text-sm text-muted-foreground">正在获取网站图标…</p>}
    {error&&<div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><p className="text-muted-foreground">仍可取消后选择图标库、手动填写或留空。</p><Button type="button" size="sm" variant="outline" onClick={()=>{setError("");setLoading(true);setSelected(null);setAttempt(value=>value+1)}}>重试</Button></div>}
    {!loading&&!error&&!icons.length&&<p className="text-sm text-muted-foreground">没有找到安全的 HTTPS 图标候选，可使用图标库或手动填写。</p>}
    <div className="max-h-[40dvh] space-y-2 overflow-y-auto p-1">{icons.map(icon=><button type="button" key={icon.url} aria-pressed={selected===icon.url} data-discovered-icon className={`flex w-full items-center gap-3 rounded-md border p-3 text-left hover:bg-accent focus-visible:outline-ring ${selected===icon.url?"border-primary bg-accent":"border-border"}`} onClick={()=>setSelected(icon.url)}><Preview url={icon.url}/><span className="min-w-0"><span className="block text-sm font-medium">{icon.name}</span><span className="block break-all text-xs text-muted-foreground">{icon.url}</span></span></button>)}</div>
    <DialogFooter className="border-t pt-4"><Button type="button" variant="ghost" onClick={onClose}>取消</Button><Button type="button" disabled={!selected||loading||!!error} onClick={()=>{if(selected){onSelect(selected);onClose()}}}>使用此图标</Button></DialogFooter>
  </DialogContent></Dialog>
}
export function WebsiteIcon({url,onSelect}:{url:string;onSelect:(url:string)=>void}) {
  const [requested,setRequested]=useState<string|null>(null)
  const [error,setError]=useState("")
  const errorId=useId()
  return <><Button type="button" variant="outline" size="sm" aria-describedby={error?errorId:undefined} onClick={()=>{if(!url.trim()){setError("请先填写网站 URL");return}setError("");setRequested(url.trim())}}><Search/>获取网站图标</Button>{error&&<p role="alert" id={errorId} className="mt-1 text-xs text-destructive">{error}</p>}{requested&&<Candidates url={requested} onClose={()=>setRequested(null)} onSelect={icon=>{if(url.trim()===requested)onSelect(icon);else setError("网站 URL 已改变，请重新获取图标")}}/>}</>
}
