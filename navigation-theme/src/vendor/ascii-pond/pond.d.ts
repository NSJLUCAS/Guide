// Types for the part of ascii-pond this theme uses. The engine is plain
// JavaScript, copied unchanged from https://github.com/stqfdyr/ascii-pond
// (MIT, see LICENSE beside it); `mount` takes more options than listed here.

type Rgb = [number, number, number]

export type PondPalette = Partial<{ page: Rgb; fg: Rgb; bg: Rgb; water: Rgb; shadow: Rgb; pellet: Rgb }>

export type PondOptions = {
  species?: (string | { type: string; count?: number; young?: number })[]
  theme?: "auto" | "dark" | "light"
  avoid?: string | null
  ignore?: string
  feed?: boolean
  speed?: number
  palette?: { dark?: PondPalette; light?: PondPalette }
}

export type PondInstance = {
  canvas: HTMLCanvasElement
  feed(x: number, y: number): void
  measure(): void
  setTheme(isLight: boolean, at?: { x: number; y: number }): void
  destroy(): void
}

export function mount(target: HTMLElement, options?: PondOptions): PondInstance
