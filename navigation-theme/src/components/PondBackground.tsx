import { useEffect, useRef } from "react"

import { mount, type PondInstance, type PondOptions } from "@/vendor/ascii-pond/pond.js"

/**
 * Koi drawn in glyphs, swimming behind the whole page (ascii-pond). Purely
 * decorative: the engine hides the canvas from assistive tech, slows it for
 * visitors who ask for reduced motion and drops it in forced-colours mode.
 *
 * The canvas is transparent and the engine mixes its tiles toward `page`/`bg`,
 * so both are the page's own --background (white, and oklch(0.145 0 0) in the
 * dark), with the dark tiles a shade bluer so a fish reads as a wash laid on the
 * page rather than a hole in it. Cards are opaque, so fish pass under them;
 * clicks on the water throw food, clicks on a card or the header never do.
 */
const PALETTE: PondOptions["palette"] = {
  light: { page: [255, 255, 255], bg: [255, 255, 255] },
  dark: { page: [10, 10, 10], bg: [10, 10, 18] },
}

const IGNORE = "a, button, input, textarea, select, label, header, [data-slot=card], [data-pond-ignore]"

export function PondBackground({ dark }: { dark: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pond = useRef<PondInstance | null>(null)
  // Read once at mount; later flips go through setTheme below.
  const initialDark = useRef(dark)

  useEffect(() => {
    if (!canvas.current) return
    const instance = mount(canvas.current, { theme: initialDark.current ? "dark" : "light", palette: PALETTE, ignore: IGNORE })
    pond.current = instance
    return () => { instance.destroy(); pond.current = null }
  }, [])

  useEffect(() => { pond.current?.setTheme(!dark) }, [dark])

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 -z-10 block size-full" />
}
