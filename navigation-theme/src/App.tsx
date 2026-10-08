import { useEffect, useState, useSyncExternalStore } from "react"
import { Moon, Search, Sun, Wrench, X } from "lucide-react"

import { ServiceCard } from "@/components/ServiceCard"
import { ServiceSummary } from "@/components/ServiceSummary"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getNavigationData } from "@/lib/service-api"
import { cardGridClass, type CardStyle } from "@/lib/card-style"
import { useCardStyle } from "@/lib/use-card-style"
import { categoriesOf, currentService, filterServices, type Service } from "@/lib/services"

const DARK_MEDIA = matchMedia("(prefers-color-scheme: dark)")

/**
 * The visitor's own choice, or the system's while there is none. Only the toggle
 * writes the choice down: persisting the system's answer on load would pin it,
 * leaving a visitor who never touched the toggle in whichever mode their system
 * happened to be in that day. The panel at `/admin/` shares this key on one
 * origin, so it has to hold to the same rule -- one app writing on load pins the
 * others.
 *
 * The system's answer is subscribed to rather than copied into state: a flip
 * landing between the first render and the effect that would have attached the
 * listener is otherwise never heard, and the next one is a day away.
 */
function useTheme() {
  const [saved, setSaved] = useState(() => localStorage.getItem("theme"))
  const system = useSyncExternalStore(
    (notify) => {
      DARK_MEDIA.addEventListener("change", notify)
      return () => DARK_MEDIA.removeEventListener("change", notify)
    },
    () => DARK_MEDIA.matches,
  )
  const dark = saved ? saved === "dark" : system

  // Switched with every transition held. Cards, buttons and badges fade their
  // colours over 150 ms while everything else changes at once, so a meter bar
  // already in the dark palette would vanish into a card still white.
  useEffect(() => {
    const hold = document.createElement("style")
    hold.textContent = "*,*::before,*::after{transition:none!important}"
    document.head.append(hold)
    document.documentElement.classList.toggle("dark", dark)
    // Resolves the new colours while transitions are off, so removing the
    // hold starts none.
    void document.body.offsetWidth
    hold.remove()
  }, [dark])

  return [
    dark,
    () => {
      const next = dark ? "light" : "dark"
      localStorage.setItem("theme", next)
      setSaved(next)
    },
  ] as const
}

export default function App() {
  const cardStyle = useCardStyle()
  const [state, setState] = useState<{ services: Service[]; managedCategories?: string[]; loading: boolean; error: string }>({ services: [], loading: true, error: "" })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      try {
        const { services, managedCategories } = await getNavigationData(controller.signal)
        if (!controller.signal.aborted) setState({ services, managedCategories, loading: false, error: "" })
      } catch (e) {
        if (!controller.signal.aborted) setState({ services: [], loading: false, error: e instanceof Error ? e.message : "请求失败" })
      } finally {
        // Schedule after completion, so a slow request never overlaps its retry.
        if (!controller.signal.aborted) timer = setTimeout(load, 30_000)
      }
    }
    const refresh = () => setAttempt(value => value + 1)
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("navigation-categories")
    if (channel) channel.onmessage = event => { if (event.data?.type === "refresh") refresh() }
    window.addEventListener("focus", refresh)
    void load()
    return () => { controller.abort(); clearTimeout(timer); channel?.close(); window.removeEventListener("focus", refresh) }
  }, [attempt])
  const retry = () => {
    setState({ services: [], loading: true, error: "" })
    setAttempt(value => value + 1)
  }
  return <NavigationPage {...state} cardStyle={cardStyle} onRetry={retry} />
}

/** Cards, filters and statistics only consume converted data; fixtures can still supply it. */
export function NavigationPage({ services, managedCategories, loading = false, error = "", onRetry, cardStyle = "standard" }: {
  services: readonly Service[]
  managedCategories?: readonly string[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  cardStyle?: CardStyle
}) {
  const [dark, toggleTheme] = useTheme()
  const [category, setCategory] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [now, setNow] = useState(Date.now)
  const categories = categoriesOf(services, managedCategories)
  const current = category === null || categories.some(c => c.value === category) ? category : null
  const shown = filterServices(services, current, query).map(service => currentService(service, Math.max(now, Date.now())))
  const tabs = [{ value: null, label: "全部", count: services.length }, ...categories]

  useEffect(() => {
    document.title = "Guide"
    const timer = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(timer)
  }, [])
  if (current !== category) setCategory(current)

  const reset = () => { setCategory(null); setQuery("") }
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <h1><button className="font-semibold transition-opacity hover:opacity-70" onClick={reset}>Guide</button></h1>
          <span className="text-xs text-muted-foreground">网站服务</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" asChild>
            <a href="/admin/"><Wrench aria-hidden />后台</a>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="切换主题" aria-label={dark ? "切换浅色" : "切换深色"}>
            {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="group" aria-label="网站分类" className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 pb-1">
            {tabs.map(({ value, label, count }) => (
              <Button key={value === null ? "*" : `=${value}`} aria-pressed={current === value}
                size="sm" variant={current === value ? "secondary" : "ghost"} className="shrink-0"
                onClick={() => setCategory(value)}>
                {label}<span className="tnum text-muted-foreground">{count}</span>
              </Button>
            ))}
          </div>
          <div role="search" className="relative w-full shrink-0 sm:w-56">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
            <input type="search" aria-label="搜索网站" placeholder="搜索名称、简介或域名" value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-8 w-full min-w-0 rounded-md border bg-background pl-8 pr-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            {query && <Button variant="ghost" size="icon-xs" className="absolute right-1 top-1" aria-label="清除搜索" onClick={() => setQuery("")}><X aria-hidden /></Button>}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : !error && <ServiceSummary services={shown} />}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p role="status" aria-live="polite">{loading ? "加载网站中…" : error ? "网站数据暂不可用" : query.trim() ? `找到 ${shown.length} 个网站` : `共 ${shown.length} 个网站`}</p>
          <p>状态由 Hub 每分钟检测</p>
        </div>
        {loading ? (
          <div className={cardGridClass(cardStyle)} aria-hidden>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className={cardStyle === "standard" ? "h-56" : cardStyle === "compact" ? "h-36" : "h-24"} />)}</div>
        ) : error ? (
          <div role="alert" className="py-10 text-center text-sm text-destructive"><p>加载失败：{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>重试</Button></div>
        ) : shown.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <p>{services.length === 0 ? "还没有网站" : "没有匹配的网站"}</p>
            {services.length > 0 && <Button variant="ghost" size="sm" className="mt-2" onClick={reset}>清除筛选</Button>}
          </div>
        ) : (
          <div className={cardGridClass(cardStyle)} aria-label="网站列表">
            {shown.map(service => <ServiceCard key={service.id} service={service} now={now} cardStyle={cardStyle} />)}
          </div>
        )}
      </main>
    </div>
  )
}
