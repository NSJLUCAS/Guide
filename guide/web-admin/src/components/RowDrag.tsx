import { useEffect, useRef, useState } from "react"
import { GripVertical } from "lucide-react"

export type DropPlace = "before" | "after"
type Drag = { id: number; over: { id: number; place: DropPlace } | null }

const EDGE = 64

/**
 * Drag-to-reorder for table rows, on pointer events so a finger works as well
 * as a mouse. Only the grip starts a drag, leaving the rest of the row to
 * scroll and select text as before. Nothing is saved until the drop, and only
 * a drop on a different row: the up/down buttons stay for keyboards.
 */
export function useRowDrag(onDrop: (dragged: number, target: number, place: DropPlace) => void, disabled: boolean) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const latest = useRef<Drag | null>(null)
  const drop = useRef(onDrop)
  useEffect(() => { drop.current = onDrop })

  const update = (next: Drag | null) => { latest.current = next; setDrag(next) }

  useEffect(() => {
    if (!drag) return
    const cancel = (event: KeyboardEvent) => { if (event.key === "Escape") update(null) }
    window.addEventListener("keydown", cancel)
    return () => window.removeEventListener("keydown", cancel)
  }, [drag])

  function grip(id: number) {
    return {
      onPointerDown(event: React.PointerEvent<HTMLElement>) {
        if (disabled || event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        update({ id, over: null })
      },
      onPointerMove(event: React.PointerEvent<HTMLElement>) {
        const current = latest.current
        if (!current) return
        if (event.clientY < EDGE) window.scrollBy(0, -12)
        else if (event.clientY > window.innerHeight - EDGE) window.scrollBy(0, 12)
        const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drag-row]")
        const target = Number(row?.dataset.dragRow)
        if (!row || !Number.isSafeInteger(target) || target === current.id) {
          if (current.over) update({ ...current, over: null })
          return
        }
        const box = row.getBoundingClientRect()
        const place: DropPlace = event.clientY < box.top + box.height / 2 ? "before" : "after"
        if (current.over?.id !== target || current.over.place !== place) update({ ...current, over: { id: target, place } })
      },
      onPointerUp() {
        const current = latest.current
        update(null)
        if (current?.over) drop.current(current.id, current.over.id, current.over.place)
      },
      onPointerCancel() { update(null) },
    }
  }

  /** Spread on the row: marks it as a drop target and draws where it would land. */
  function row(id: number) {
    return {
      "data-drag-row": id,
      "data-dragging": drag?.id === id || undefined,
      "data-drop": drag?.over?.id === id ? drag.over.place : undefined,
    }
  }

  return { grip, row, dragging: drag !== null }
}

export const dragRowClass = "data-[dragging]:opacity-40 data-[drop=before]:[&>td]:shadow-[inset_0_2px_0_var(--foreground)] data-[drop=after]:[&>td]:shadow-[inset_0_-2px_0_var(--foreground)]"

export function DragGrip({ label, disabled, ...handlers }: { label: string; disabled: boolean } & ReturnType<ReturnType<typeof useRowDrag>["grip"]>) {
  return (
    <span aria-hidden title={label} {...handlers}
      className={disabled ? "flex text-muted-foreground/40" : "flex cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"}>
      <GripVertical className="size-4" />
    </span>
  )
}
