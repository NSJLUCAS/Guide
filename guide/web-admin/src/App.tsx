import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { ExternalLink, LogOut, Moon, Sun } from "lucide-react"
import { Toaster } from "sonner"

import { Admin } from "@/components/Admin"
import { Login } from "@/components/Login"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { api } from "@/lib/api"
import { normaliseAdminPath as normalise } from "@/lib/navigation"

type Me = { authed: boolean; github: boolean; site_name: string; public_page: boolean; site: string }

// `/admin` alone is not a page; it is normalised to the first section so that a
// bookmark and the OAuth redirect both resolve to a real route.

function usePath() {
  const [path, setPath] = useState(() => {
    const start = normalise(location.pathname)
    if (start !== location.pathname) history.replaceState({}, "", start + location.search)
    return start
  })
  useEffect(() => {
    const sync = () => setPath(normalise(location.pathname))
    addEventListener("popstate", sync)
    return () => removeEventListener("popstate", sync)
  }, [])
  return [
    path,
    useCallback((next: string) => {
      const to = normalise(next)
      history.pushState({}, "", to)
      setPath(to)
    }, []),
  ] as const
}

const DARK_MEDIA = matchMedia("(prefers-color-scheme: dark)")

/**
 * The operator's own choice, or the system's while there is none. Only the toggle
 * writes the choice down: persisting the system's answer on load would pin it,
 * and the public theme served from the same origin reads this key too, so one
 * visit to the panel would leave the status page in whichever mode the system
 * happened to be in at that moment, no longer following it.
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

  // Switched with every transition held. Buttons, badges and table rows fade
  // their colours over 150 ms while everything else changes at once, leaving
  // the page in both palettes for that long.
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
  const [path, go] = usePath()
  const [dark, toggleTheme] = useTheme()
  const [me, setMe] = useState<Me | null>(null)
  const [meError, setMeError] = useState("")

  const loadMe = useCallback(() => {
    return api<Me>("/me")
      .then((next) => { setMe(next); setMeError("") })
      .catch((e: Error) => setMeError(e.message))
  }, [])
  useEffect(() => {
    loadMe()
  }, [loadMe])

  // Recheck the existing session without subscribing to the probe's Node stream.
  // The backend remains the authority for every protected request.
  useEffect(() => {
    if (!me?.authed) return
    const check = () => { void loadMe() }
    const timer = setInterval(check, 30_000)
    addEventListener("focus", check)
    return () => { clearInterval(timer); removeEventListener("focus", check) }
  }, [me?.authed, loadMe])

  // Keep a mounted panel visible during a transient session-check failure.
  if (!me) return (
    <div className="grid min-h-svh place-items-center p-6 text-sm text-muted-foreground">
      {meError ? <div className="space-y-3 text-center"><p role="alert">加载失败：{meError}</p><Button onClick={loadMe}>重试</Button></div> : "加载中…"}
    </div>
  )

  if (!me.authed) {
    return (
      <>
        <Login github={me.github} onDone={() => { loadMe(); go("/admin/services") }} />
        <Toaster position="top-center" theme={dark ? "dark" : "light"} />
      </>
    )
  }

  async function signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => {})
    location.href = "/"
  }

  return (
    // The browser's own title tooltip waits a second or more and cannot be
    // shortened; these open after 300 ms.
    <TooltipProvider delayDuration={300}>
      <div className="min-h-svh">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            {/* The site name is the way back to the status page, as in the
                theme's own header. */}
            <a href="/" className="font-semibold transition-opacity hover:opacity-70">
              {me.site_name || "Guide"}
            </a>
            <span className="text-xs text-muted-foreground">后台</span>
            <div className="flex-1" />
            {/* The status page is a separate app, so this is a navigation. */}
            <Button variant="ghost" size="sm" asChild>
              <a href="/">
                <ExternalLink /> 导航首页
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="切换主题">
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="退出登录">
              <LogOut />
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
          {meError && <p role="alert" className="text-sm text-destructive">{meError}</p>}
          <Admin path={path} go={go} site={me.site || location.origin} reloadMe={loadMe} />
        </main>

        <Toaster position="top-center" theme={dark ? "dark" : "light"} />
      </div>
    </TooltipProvider>
  )
}
