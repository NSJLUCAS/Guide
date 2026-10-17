import { useEffect, useState } from "react"
import { Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { copy } from "@/lib/clipboard"
import { CHECK_COMMAND, hasUpdate, loadGuideRelease, RELEASES_PAGE, releaseNotesUrl, UPDATE_COMMAND, type GuideRelease } from "@/lib/guide-release"

/**
 * Shows what is running and what is published, links to the release notes,
 * and hands over the terminal command. The panel never updates the hub: the
 * operator reads what changed and decides.
 */
export function GuideUpdate() {
  const [release, setRelease] = useState<GuideRelease | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    loadGuideRelease().then(next => { if (active) setRelease(next) }, (e: Error) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [])
  const update = hasUpdate(release)
  return (
    <Card id="guide-update" className="gap-4 p-5">
      <div>
        <h2 className="font-medium">版本更新</h2>
        <p className="mt-1 text-xs text-muted-foreground">后台只检查新版本，不会自动更新。先看看更新了什么，再决定要不要在服务器上更新。</p>
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">检查失败：{error}</p>
        : !release ? <p role="status" className="text-sm text-muted-foreground">检查中…</p>
        : <>
          <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex gap-2"><dt className="text-muted-foreground">当前版本</dt><dd className="tnum">v{release.current}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">最新版本</dt><dd className="tnum">{release.latest ? `v${release.latest}` : "暂时连不上 GitHub"}{update && <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground">有新版本</span>}</dd></div>
          </dl>
          {update ? <>
            <div><Button size="sm" asChild><a href={releaseNotesUrl(release.latest)} target="_blank" rel="noopener noreferrer"><ExternalLink /> 查看 v{release.latest} 更新内容</a></Button></div>
            <div className="space-y-2 text-sm">
              <p>看完决定更新的话，在服务器终端运行：</p>
              <div className="flex items-center gap-2">
                <code className="rounded-md border bg-muted px-3 py-1.5 font-mono text-xs">{UPDATE_COMMAND}</code>
                <Button size="icon-sm" variant="ghost" title="复制命令" aria-label="复制更新命令" onClick={() => copy(UPDATE_COMMAND, "命令已复制")}><Copy /></Button>
              </div>
              <p className="text-xs text-muted-foreground">更新前会自动备份数据库，失败会自动回滚。只想确认版本、不更新：<code className="font-mono">{CHECK_COMMAND}</code></p>
            </div>
          </> : <div><Button size="sm" variant="outline" asChild><a href={RELEASES_PAGE} target="_blank" rel="noopener noreferrer"><ExternalLink /> {release.latest ? "已是最新版本，查看更新日志" : "去 GitHub 查看发布记录"}</a></Button></div>}
        </>}
    </Card>
  )
}
