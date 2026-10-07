import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CARD_STYLES, loadCardStyle, saveCardStyle, type CardStyle } from "@/lib/card-appearance"

export function CardAppearance() {
  const [style,setStyle]=useState<CardStyle>("standard")
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState("")
  const [loadFailed,setLoadFailed]=useState(false)
  const [attempt,setAttempt]=useState(0)
  const writing=useRef(false)
  useEffect(()=>{
    let active=true
    loadCardStyle().then(style=>{if(active){setStyle(style);setLoading(false);setLoadFailed(false)}}).catch((error:Error)=>{if(active){setError(error.message);setLoading(false);setLoadFailed(true)}})
    return()=>{active=false}
  },[attempt])
  async function save(){
    if(writing.current)return
    writing.current=true;setSaving(true);setError("")
    try{await saveCardStyle(style);toast.success("卡片样式已保存，公开导航已生效")}
    catch(error){setError(`保存失败：${(error as Error).message}`)}
    finally{writing.current=false;setSaving(false)}
  }
  return <Card className="gap-4 p-5"><div><h2 className="font-medium">导航外观</h2><p className="mt-1 text-xs text-muted-foreground">设置全站卡片密度，标准模式保留当前布局。</p></div>
    {loading&&<p role="status" className="text-sm text-muted-foreground">加载卡片样式中…</p>}
    {!loading&&<fieldset disabled={saving||loadFailed} className="space-y-2"><legend className="mb-2 text-sm font-medium">卡片样式</legend><div className="flex flex-wrap gap-4">{CARD_STYLES.map(option=><label key={option.value} className="flex items-center gap-2 text-sm"><input type="radio" name="service-card-style" value={option.value} checked={style===option.value} onChange={()=>setStyle(option.value)} className="accent-primary" />{option.label}</label>)}</div></fieldset>}
    {error&&<div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p>{loadFailed&&<Button type="button" size="sm" variant="outline" disabled={saving||loading} onClick={()=>{setError("");setLoading(true);setAttempt(value=>value+1)}}>重试加载</Button>}</div>}
    <div><Button type="button" size="sm" disabled={loading||saving||loadFailed} onClick={()=>void save()}>{saving?"保存中…":"保存卡片样式"}</Button></div>
  </Card>
}
