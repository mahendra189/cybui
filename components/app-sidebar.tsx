"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  BookOpen,
  Bot,
  Map,
  Settings2,
  SquareTerminal,
  Network,
  Target,
  Shield,
  User
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Modern navigation data
const navData = {
  teams: [
    {
      name: "Qshield",
      logo: Shield,
      plan: "Security Intelligence",
    },
  ],
  navMain: [
    {
      title: "Targets",
      url: "/targets",
      icon: Target,
      isActive: true,
    },
    {
      title: "Topology",
      url: "/topology",
      icon: Network,
    },
    {
      title: "Assets",
      url: "/assets",
      icon: SquareTerminal,
    },
    {
      title: "Services",
      url: "/services",
      icon: Bot,
    },
    {
      title: "Ports",
      url: "/ports",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Hide sidebar on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register"
  if (isAuthPage) return null

  const userData = {
    name: session?.user?.name || "Initializing...",
    email: session?.user?.email || "",
    avatar: "",
    // @ts-ignore
    role: session?.user?.role || "customer"
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
