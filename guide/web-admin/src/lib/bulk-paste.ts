export type PastedLink = { url: string; title: string }
export type PastedLinks = { links: PastedLink[]; rejected: string[] }

const LINK = /https?:\/\/[^\s<>"'`]+/i
const MARKDOWN = /^\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/i

/** The address the hub would store, or null for anything a service cannot hold. */
export function normalizeLink(value: string): string | null {
  const raw = value.trim()
  const authority = /^https?:\/\/([^/?#]+)/i.exec(raw)?.[1]
  if (!authority || authority.includes("@") || [...raw].length > 2048) return null
  try {
    const url = new URL(raw)
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null
    return url.href
  } catch { return null }
}

/**
 * A browser's "copy all tabs" text: one address per line, optionally after a
 * title or as a Markdown link. Repeats collapse to the first; lines without a
 * usable address come back as rejected so nothing is dropped silently.
 */
export function parsePastedLinks(text: string): PastedLinks {
  const links: PastedLink[] = []
  const rejected: string[] = []
  const seen = new Set<string>()
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const markdown = MARKDOWN.exec(line)
    const match = markdown ? null : LINK.exec(line)
    const url = normalizeLink(markdown?.[2] ?? match?.[0] ?? "")
    if (!url) { rejected.push(line); continue }
    if (seen.has(url)) continue
    seen.add(url)
    const title = markdown ? markdown[1] : line.slice(0, match!.index).replace(/[\s:：|·\-–—]+$/, "")
    links.push({ url, title: [...title.trim()].slice(0, 100).join("") })
  }
  return { links, rejected }
}

/** Whether a paste on the services page is a list of addresses and nothing else. */
export function looksLikeLinks(text: string): boolean {
  const { links, rejected } = parsePastedLinks(text)
  return links.length > 0 && rejected.length === 0
}

/** The name a site gets when its page offers no title: the host without `www.`. */
export function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./i, "") } catch { return url }
}

/** Addresses already configured, compared the way pasted ones are. */
export function knownLinks(services: readonly { url: string }[]): Set<string> {
  return new Set(services.map(service => normalizeLink(service.url) ?? service.url))
}

/** Runs `work` over every item with at most `limit` in flight. */
export async function eachLimited<T>(items: readonly T[], limit: number, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  const lane = async () => { while (next < items.length) await work(items[next++]) }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
}
