"use client";

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Activity, 
  ShieldCheck, 
  Router, 
  Cpu, 
  Network, 
  RefreshCw, 
  Layers, 
  Server, 
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { useGlobalData } from "@/app/context/GlobalDataContext"
import Link from "next/link"

export default function Page() {
  const { data, isLoading, refreshData } = useGlobalData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Synchronizing CYB security telemetry...</p>
      </div>
    );
  }

  // Calculate totals
  const totalAssets = data.assets?.length || 0;
  const totalPorts = data.ports?.length || 0;
  const totalServices = data.services?.length || 0;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              CYB Agent Active
            </Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Security Reconnaissance
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Intelligence-driven network mapping, threat detection, and agent deployment status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Telemetry
          </Button>
          <Link href="/targets/new">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Deploy New Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Security Posture Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500 bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Health</CardTitle>
            <Activity className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">Optimal</div>
            <p className="text-xs text-muted-foreground mt-1">CYB Node active & fully synced</p>
          </CardContent>
        </Card>

        <Link href="/assets" className="block group">
          <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Discovered Assets</CardTitle>
              <Cpu className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{totalAssets}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                View monitored devices <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/services" className="block group">
          <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Exposed Ports</CardTitle>
              <Network className="h-5 w-5 text-violet-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{totalPorts}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                Across {totalServices} active services <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/topology" className="block group">
          <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Threat Posture</CardTitle>
              <Shield className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">Secured</span>
                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 text-xs font-normal">Active MitM Shield</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                View network topology map <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Interactive Diagram Section */}
      <Card className="border shadow-lg overflow-hidden bg-card/60 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 border-b p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                CYB Agent Architecture & Threat Models
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Explore the onboarding model and network interception shields deployed on your infrastructure.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="threat-protection" className="w-full">
          <div className="px-6 py-2 border-b bg-muted/10">
            <TabsList className="bg-muted">
              <TabsTrigger value="threat-protection" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Network Threat Model (MitM Defense)
              </TabsTrigger>
              <TabsTrigger value="agent-onboarding" className="flex items-center gap-2">
                <Router className="h-4 w-4" />
                Gateway Agent Onboarding
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            {/* Tab 1: Threat Protection (MitM Defense) */}
            <TabsContent value="threat-protection" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Text explanation */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/10">Defense Intercept Model</Badge>
                    <h3 className="text-2xl font-bold tracking-tight">Man-in-the-Middle (MitM) Isolation</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      On standard networks, an attacker (represented by the top-hat actor) can hijack traffic passing between clients (laptops, mobile phones, smart TVs) and the default router. 
                    </p>
                  </div>
                  
                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">How CYB Secures the Network:</h4>
                    <ul className="space-y-3">
                      {[
                        { title: "Gateway Protection", desc: "The CYB agent runs directly on or adjacent to the Router, establishing a secure telemetry channel." },
                        { title: "MitM Interception Block", desc: "Monitors ARP cache changes, rogue DNS packets, and spoofed routing advertisements." },
                        { title: "Autonomous Defense Bot", desc: "A micro-agent continuously audits connections, detecting anomalies in real-time." },
                        { title: "Broad Device Shield", desc: "Safeguards all legacy, modern, and IoT appliances without requiring per-device agent installations." }
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 font-bold text-xs text-center leading-5">✓</span>
                          <div>
                            <span className="font-semibold text-foreground">{item.title}: </span>
                            <span className="text-muted-foreground">{item.desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Link href="/topology">
                      <Button className="w-full flex items-center justify-center gap-2" variant="outline">
                        Inspect Active Connections Map
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Styled Image Container */}
                <div className="lg:col-span-7">
                  <div className="relative border rounded-xl overflow-hidden bg-zinc-950 p-4 shadow-inner ring-1 ring-zinc-800 flex items-center justify-center group">
                    <div className="absolute top-3 left-3 bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Threat Canvas
                    </div>
                    
                    <img 
                      src="/network-threat-model.png" 
                      alt="Network Threat Model / MitM Shield" 
                      className="w-full max-h-[420px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Agent Onboarding */}
            <TabsContent value="agent-onboarding" className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Text explanation */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10">Reconnaissance Core</Badge>
                    <h3 className="text-2xl font-bold tracking-tight">Onboard Agent & Target Discovery</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Onboarding is the initial phase of deployment. Once configured, the CYB Agent connects directly to the Router Gateway to start continuous reconnaissance.
                    </p>
                  </div>
                  
                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key Capabilities:</h4>
                    <ul className="space-y-3">
                      {[
                        { title: "Device Discovery", desc: "Automatically monitors subnet broadcasts and maps all connected hosts on the physical network." },
                        { title: "Open Ports Analysis", desc: "Runs continuous TCP/UDP port mapping on identified assets without manual trigger." },
                        { title: "Exposed Services Scrape", desc: "Interrogates listening ports to catalog protocols (SSH, HTTP, databases) and version numbers." },
                        { title: "Automated Synchronization", desc: "Streams asset telemetry back to this dashboard using secure, encrypted tunnels." }
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-500 font-bold text-xs text-center leading-5">✓</span>
                          <div>
                            <span className="font-semibold text-foreground">{item.title}: </span>
                            <span className="text-muted-foreground">{item.desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Link href="/targets/new">
                      <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:text-zinc-950">
                        Configure Router Target
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Styled Image Container */}
                <div className="lg:col-span-7">
                  <div className="relative border rounded-xl overflow-hidden bg-zinc-950 p-4 shadow-inner ring-1 ring-zinc-800 flex items-center justify-center group">
                    <div className="absolute top-3 left-3 bg-zinc-900/80 border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Deployment Flow Canvas
                    </div>

                    <img 
                      src="/agent-onboarding.png" 
                      alt="CYB Agent Onboarding Flow" 
                      className="w-full max-h-[420px] object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Bottom Features / Details section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
              <Server className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold">1. Asset Discovery</CardTitle>
            <CardDescription className="text-xs">
              CYB listens to local network exchanges and identifies MAC/IP assignments of connected computers, mobile devices, and gateways.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Current catalog contains <strong className="text-foreground">{totalAssets} active hosts</strong> running in identified IP scopes.
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-2">
              <Network className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold">2. Service & Port Audit</CardTitle>
            <CardDescription className="text-xs">
              Every host is probed for open ports. CYB grabs service banners to catalog active services and exposed risk profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Actively monitoring <strong className="text-foreground">{totalPorts} logical ports</strong> across all targets.
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <Shield className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold">3. Rogue Actor Isolation</CardTitle>
            <CardDescription className="text-xs">
              If an attacker attempts a Man-in-the-Middle spoofing attack, CYB flags the MAC signature and alerts the management dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Shield configuration is <strong className="text-foreground">operational</strong>. Threat levels are evaluated as low.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
