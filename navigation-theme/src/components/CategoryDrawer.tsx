import { useLayoutEffect, useRef, type ReactNode } from "react"

const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)")
// The hand takes hold for the first 28% of the pull, then the drawer slides out.
const PULL_MS = 780
const PULL = "cubic-bezier(.3,1.25,.5,1)"

/**
 * A category's cards in a drawer that a line-drawn hand pulls open whenever
 * `openKey` changes. Only pixels move: the cards are in the document from the
 * first frame, so counts, search and screen readers never wait on the animation,
 * and every animation ends without a fill, leaving the height to the content.
 */
export function CategoryDrawer({ openKey, children }: { openKey: string; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null)
  const hand = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    if (REDUCED_MOTION.matches || !body.current || !hand.current) return
    const full = body.current.scrollHeight
    const running = [
      body.current.animate([
        { height: "0px" },
        { height: "0px", offset: 0.28, easing: PULL },
        { height: `${full}px` },
      ], { duration: PULL_MS }),
      hand.current.animate([
        { opacity: 0, transform: "translateY(22px)" },
        { opacity: 1, transform: "translateY(0)", offset: 0.23 },
        { opacity: 1, transform: "rotate(-3deg)", offset: 0.35 },
        { opacity: 1, transform: "rotate(-3deg)", offset: 0.8 },
        { opacity: 0, transform: "translateY(12px)" },
      ], { duration: PULL_MS + 200 }),
      // Capped, so a long category does not keep its last cards waiting.
      ...[...body.current.querySelectorAll("[data-service-id]")].map((card, i) => card.animate([
        { opacity: 0, transform: "translateY(-8px)" },
        { opacity: 1, transform: "none" },
      ], { duration: 250, delay: PULL_MS - 60 + Math.min(i, 12) * 35, easing: "ease-out", fill: "backwards" })),
    ]
    // A new tab mid-pull starts over from closed instead of from wherever this one got to.
    return () => running.forEach(animation => animation.cancel())
  }, [openKey])

  return (
    <section data-category-drawer={openKey} className="relative rounded-lg border-[1.5px] border-t-[3px] border-foreground">
      <div ref={body} className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-2 top-2 bottom-0 border border-b-0 border-foreground/25" />
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 w-[11.3px] origin-top-left rotate-45 border-t border-foreground/25" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 w-[11.3px] origin-top-right -rotate-45 border-t border-foreground/25" />
        <div className="relative px-4 pt-4 pb-3">{children}</div>
      </div>
      <div className="px-1.5 pb-2.5">
        <div className="relative flex h-12 items-center justify-center rounded-md border-[1.5px] border-foreground bg-card text-foreground before:pointer-events-none before:absolute before:inset-[5px] before:rounded-[3px] before:border before:border-foreground/25 after:pointer-events-none after:absolute after:inset-x-[3px] after:-bottom-[7px] after:h-[5px] after:rounded-b-md after:border-[1.5px] after:border-t-0 after:border-foreground">
          <Handle />
          <svg ref={hand} viewBox="0 0 70 96" aria-hidden className="pointer-events-none absolute top-0.5 left-[calc(50%-33px)] z-20 h-24 w-[70px] opacity-0">
            <path d="M12 40C11 56 16 68 24 74L24 96L60 96L60 60C64 56 72 50 70 44C68 38 62 40 55 44L55 40Z" fill="var(--card)" />
            <g fill="var(--card)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 42V22a5 5 0 0 1 10 0V42" />
              <path d="M22 42V16a5.5 5.5 0 0 1 11 0V42" />
              <path d="M33 42V14a5.5 5.5 0 0 1 11 0V42" />
              <path d="M44 42V17a5.5 5.5 0 0 1 11 0V44" />
              <path d="M55 44C62 40 68 38 70 44C72 50 64 56 60 60L60 96" fill="none" />
              <path d="M12 40C11 56 16 68 24 74L24 96" fill="none" />
            </g>
            <path d="M14 30h6M24.5 27h6M35.5 26h6M46.5 28h6M15 21q2-2 5 0M25 15q3-2 6 0M36 13q3-2 6 0M47 16q3-2 6 0M30 56q6 4 14 2"
              fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}

function Handle() {
  return (
    <svg width="96" height="20" viewBox="0 0 96 20" aria-hidden className="relative">
      <g fill="var(--card)" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="2" width="7" height="7" rx="1.5" />
        <rect x="81" y="2" width="7" height="7" rx="1.5" />
        <rect x="3" y="7" width="90" height="9" rx="4.5" />
      </g>
      <path d="M10 10h76" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.75" />
    </svg>
  )
}
