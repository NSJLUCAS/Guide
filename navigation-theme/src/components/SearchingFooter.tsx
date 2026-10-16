/**
 * A small figure walking the foot of the page with a flashlight, looking for
 * something -- what a navigation page is for. Purely decorative: hidden from
 * assistive tech, and held still for visitors who ask for reduced motion.
 *
 * The SVG is drawn facing right with the figure at its centre, so mirroring
 * it to walk back turns him in place. The "?" lives outside the mirrored part
 * so it never reads backwards.
 *
 * Under the walk sits the one thing here that is not decoration: a link to the
 * project's repository.
 */
const REPOSITORY = "https://github.com/NSJLUCAS/Guide"

export function SearchingFooter() {
  return (
    <footer className="searching-footer mx-auto mt-8 max-w-[1400px] px-4 pb-6 sm:px-6">
      <div aria-hidden className="relative h-28 overflow-hidden">
        <div className="absolute inset-x-0 bottom-3 border-t border-dashed" />
        <div className="searching-walker absolute bottom-3 h-24 w-60">
          <span className="searching-ask absolute left-1/2 top-0 ml-3 text-sm font-semibold text-muted-foreground">?</span>
          <div className="searching-turn size-full">
            <svg viewBox="-120 0 240 100" className="size-full overflow-visible text-muted-foreground"
              fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="searching-beam" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="var(--beam)" stopOpacity="0.85" />
                  <stop offset="1" stopColor="var(--beam)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="searching-bob">
                {/* Legs and the free arm swing about the hip and shoulder. */}
                <line className="searching-leg-a" x1="0" y1="62" x2="0" y2="96" />
                <line className="searching-leg-b" x1="0" y1="62" x2="0" y2="96" />
                <line className="searching-arm-back" x1="0" y1="40" x2="0" y2="58" />
                <line x1="0" y1="36" x2="0" y2="62" />
                <circle cx="0" cy="26" r="8" fill="var(--background)" />
                {/* The flashlight arm sweeps its beam over the ground ahead. */}
                <g className="searching-sweep">
                  <polygon points="22,44 118,14 118,92" fill="url(#searching-beam)" stroke="none" className="searching-beam" />
                  <polyline points="0,40 10,48 16,44" />
                  <rect x="14" y="41" width="9" height="5" rx="1.5" fill="currentColor" transform="rotate(-8 18 43.5)" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
      <a href={REPOSITORY} target="_blank" rel="noopener noreferrer" title="在 GitHub 查看源码"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Guide
      </a>
    </footer>
  )
}
