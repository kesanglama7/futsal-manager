"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarClock,
  Shield,
  LogOut,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { resolveMediaUrl } from "@/lib/media"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const CMS_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/cms", icon: LayoutDashboard },
  { label: "Team Management", href: "/cms/teams", icon: Shield },
  { label: "Matches", href: "/cms/matches", icon: CalendarClock },
]

const USER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/user", icon: LayoutDashboard },
]

interface AppSidebarProps {
  variant: "cms" | "user"
}

export function AppSidebar({ variant }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const navItems = variant === "cms" ? CMS_NAV_ITEMS : USER_NAV_ITEMS
  const title = variant === "cms" ? "Futsal CMS Portal" : "Futsal User Portal"
  const avatarUrl = user?.avatar ? resolveMediaUrl(user.avatar) : null
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Shield className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-display text-base font-bold uppercase">{title}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/cms"
                  ? pathname === "/cms"
                  : pathname.startsWith(item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={avatarUrl ?? undefined} alt={user?.name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs">
                  {user?.email ?? "Not signed in"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign Out"
              variant="outline"
              className="w-full"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
