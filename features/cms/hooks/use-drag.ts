"use client"

import { useRef, useState } from "react"

const DRAG_THRESHOLD = 4 // px of movement before a pointer session counts as a drag

/**
 * Native pointer-event drag that reports percentage coordinates relative to a
 * container element. Replaces the framer-motion drag from the design reference
 * without adding a dependency.
 *
 * Returns element handlers, a `dragging` flag for styling, and `didDrag` so
 * callers can suppress a click that immediately follows an actual drag.
 */
export function useDrag() {
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const clamp = (value: number) => Math.max(5, Math.min(95, value))

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true
    movedRef.current = false
    startRef.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
    onMove: (x: number, y: number) => void
  ) => {
    if (!draggingRef.current) return

    const start = startRef.current
    if (start) {
      const dx = Math.abs(event.clientX - start.x)
      const dy = Math.abs(event.clientY - start.y)
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        movedRef.current = true
      }
    }

    const pitch = event.currentTarget.closest("[data-pitch]") as HTMLElement | null
    if (!pitch) return

    const rect = pitch.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100)
    onMove(x, y)
  }

  const stopDrag = () => {
    draggingRef.current = false
    startRef.current = null
    setDragging(false)
  }

  return {
    dragging,
    /** Returns true if the most recent pointer session was an actual drag —
     * call from a click handler to suppress a picker open after dragging. */
    didDrag: () => movedRef.current,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: stopDrag,
      onPointerCancel: stopDrag,
    },
  }
}
