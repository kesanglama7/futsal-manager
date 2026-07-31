"use client"

import { Users, Shield, Trophy } from "lucide-react"

import { LogoutButton } from "@/components/layout/logout-button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const STATS = [
  { label: "Teams", value: "—", icon: Shield },
  { label: "Players", value: "—", icon: Users },
  { label: "Formations", value: "—", icon: Trophy },
]

export default function CMSPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome to the Futsal CMS Portal.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Team and formation management will be available here soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to navigate between Dashboard, Team Management, and
            Matches.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
