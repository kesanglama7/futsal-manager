"use client"

import { AppSidebar } from "@/features/cms/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface DashboardShellProps {
  variant: "cms" | "user"
  title: string
  children: React.ReactNode
}

export function DashboardShell({
  variant,
  title,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar variant={variant} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <h1 className="text-sm font-medium">{title}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
