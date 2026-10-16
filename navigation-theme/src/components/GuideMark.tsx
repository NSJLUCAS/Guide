/** The favicon's two chevrons, drawn in the page's own colours so they follow its theme. */
export function GuideMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14 L30 32 L12 50" stroke="currentColor" className="text-muted-foreground" />
      <path d="M32 14 L50 32 L32 50" stroke="currentColor" />
    </svg>
  )
}
