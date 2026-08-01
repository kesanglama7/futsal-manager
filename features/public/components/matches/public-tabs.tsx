"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Minimal button-based tab switcher (no shadcn Tabs dependency). Mirrors the
 * a11y semantics of a tabs list with an active underline.
 */
export function PublicTabs({
  tabs,
  defaultTab,
  children,
}: {
  tabs: { id: string; label: string }[]
  defaultTab: string
  children: (active: string) => React.ReactNode
}) {
  const [active, setActive] = useState(defaultTab)

  return (
    <div>
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{children(active)}</div>
    </div>
  )
}
