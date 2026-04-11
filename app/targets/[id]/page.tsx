"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Building2, Globe, Activity, Server, Target, CornerDownRight, Network,
  Terminal, Bot, Send, HardDrive, ListEnd, Clock,
  AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useGlobalData } from "@/app/context/GlobalDataContext"

export default function TargetDetailPage() {
  const params = useParams()
  const targetId = params.id as string
  const { data } = useGlobalData()

  // Find target from live context
  const rawTarget = data.targets.find(t => t._id === targetId || t.id === targetId)

  // Simulation state for the interactive Agent Chat / Logs
  const [chatMessages, setChatMessages] = React.useState([
    { role: 'agent', content: "Initializing discovery pipeline...", type: "log" },
    { role: 'agent', content: "Running Subfinder for subdomain enumeration.", type: "log" },
    { role: 'agent', content: "Found 12 raw subdomains. Handoff to HTTPX for live host checking.", type: "log" },
    { role: 'agent', content: "Starting Nmap against verified live hosts.", type: "log" }
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = { role: 'user', content: chatInput, type: 'chat' };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");

    // Simulate Agent reacting to user instructions
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { role: 'agent', content: `Acknowledged command: "${newMsg.content}"`, type: 'chat' },
        { role: 'agent', content: `Adjusting scanning parameters and executing...`, type: 'log' }
      ]);
    }, 800);
  }

  if (!rawTarget) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center bg-card border border-muted p-8 rounded-xl shadow-lg">
          <Terminal className="size-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Target Not Found</h2>
          <p className="text-muted-foreground mb-6">The infrastructure mapped to ID {targetId} could not be located in the current database.</p>
          <Button asChild><Link href="/targets">Return to Targets List</Link></Button>
        </div>
      </div>
    )
  }

  // Gracefully conform MongoDB object to UI requirements
  const target = {
    ...rawTarget,
    organizationName: rawTarget.organizationName || rawTarget.name || "Unknown Target",
    primaryDomain: rawTarget.domain || rawTarget.primaryDomain || "unknown.com",
  };

  // Derive live counts from global data relationships
  const targetAssets = data.assets.filter(a => a.targetId === targetId);
  const targetPorts = data.ports.filter(p => p.targetId === targetId);
  const targetServices = data.services.filter(s => s.targetId === targetId);

  // Fallbacks for display if relational mappings aren't perfectly seeded for the mock target
  const displayAssets = targetAssets.length > 0 ? targetAssets : data.assets;
  const displayPorts = targetPorts.length > 0 ? targetPorts : data.ports;
  const displayServices = targetServices.length > 0 ? targetServices : data.services;

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">

      {/* 1. Header: Live Summary and Info */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex gap-5 items-center">
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 shadow-inner">
            <Building2 className="size-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">{target.organizationName}</h1>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1.5 px-2.5 py-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Agent Sync Active
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><Globe className="size-4" /> {target.primaryDomain}</span>
              <span className="hidden md:inline text-muted-foreground/30">•</span>
              <span className="flex items-center gap-1.5 font-mono text-xs">ID: {targetId}</span>
            </div>
          </div>
        </div>

        {/* Live Counter Dashboard */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
          <div className="flex flex-col justify-center items-center px-6 py-2 bg-muted/30 border rounded-lg min-w mt-2">
            <span className="text-2xl font-black tabular-nums text-foreground">{displayAssets.length}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Server className="size-3" /> Assets Discovered</span>
          </div>
          <div className="flex flex-col justify-center items-center px-6 py-2 bg-muted/30 border rounded-lg mt-2">
            <span className="text-2xl font-black tabular-nums text-foreground">{displayPorts.length}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Network className="size-3" /> Open Ports</span>
          </div>
          <div className="flex flex-col justify-center items-center px-6 py-2 bg-muted/30 border rounded-lg mt-2">
            <span className="text-2xl font-black tabular-nums text-foreground">{displayServices.length}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><HardDrive className="size-3" /> Services Detected</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Left Column: Dynamic Sections */}
        <div className="lg:col-span-2 flex flex-col h-full bg-card border rounded-lg shadow-sm overflow-hidden">
          <Tabs defaultValue="subdomains" className="flex flex-col w-full h-full">
            <div className="border-b px-4 py-3 bg-muted/10">
              <TabsList className="bg-muted/50 border">
                <TabsTrigger value="subdomains" className="gap-2"><Globe className="size-4" /> Found Subdomains</TabsTrigger>
                <TabsTrigger value="ports" className="gap-2"><Network className="size-4" /> Open Ports</TabsTrigger>
                <TabsTrigger value="history" className="gap-2"><Clock className="size-4" /> Historical URLs</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-dot-black/[0.1] dark:bg-dot-white/[0.1]">

              <TabsContent value="subdomains" className="m-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayAssets.map((asset, i) => (
                    <div key={i} className="flex flex-col p-4 bg-background border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm tracking-tight">{asset.deviceName || asset.name || `host-${i}.${target.primaryDomain}`}</span>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Alive</Badge>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground mb-3">{asset.ip || `10.0.${i}.x`}</span>
                      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                        <CornerDownRight className="size-3" /> Source: Amass / Subfinder
                      </div>
                    </div>
                  ))}
                  {displayAssets.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-background/50">
                      Scanning in progress. Waiting for subdomains...
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ports" className="m-0 h-full">
                <div className="rounded-md border bg-background overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Node IP</th>
                        <th className="px-4 py-3 font-medium">Port</th>
                        <th className="px-4 py-3 font-medium">Service</th>
                        <th className="px-4 py-3 font-medium text-right">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {displayPorts.map((port, i) => (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{port.hostIp || "10.0.1.15"}</td>
                          <td className="px-4 py-3 font-bold">{port.portNumber || port.port} <span className="text-xs font-normal text-muted-foreground uppercase ml-1">{port.protocol}</span></td>
                          <td className="px-4 py-3 font-medium">{port.service || port.description}</td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant="outline" className={port.state === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                              {port.state || "open"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0 h-full">
                <div className="space-y-3">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-500 items-start">
                    <AlertTriangle className="size-5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold">Historical Data Gathering</p>
                      <p className="opacity-90 mt-1">Wayback Machine and AlienVault queries have been queued. The agent is analyzing archived URL parameters.</p>
                    </div>
                  </div>
                  <Card className="bg-background shadow-sm border-dashed">
                    <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                      <ListEnd className="size-8 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm font-medium">Synchronizing with historical archives...</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        As the agent uncovers URLs like /api/v1/auth?token= from historical sources, they will populate here dynamically.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* Right Column: Interactive Agent Terminal */}
        <div className="flex flex-col h-[600px] lg:h-full bg-zinc-950 border-zinc-800 border rounded-lg shadow-xl overflow-hidden text-zinc-100 flex-1">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <h3 className="font-semibold text-sm tracking-tight text-white">Agent Operations Console</h3>
            </div>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] font-mono">Live Session</Badge>
          </div>

          {/* Feed List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm"
          >
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'agent' && (
                  <div className={`mt-1 shrink-0 size-6 rounded flex items-center justify-center ${msg.type === 'log' ? 'bg-zinc-800 text-zinc-400' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                    {msg.type === 'log' ? <Terminal className="size-3" /> : <Bot className="size-3" />}
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : ''} max-w-[85%]`}>
                  {msg.role === 'agent' && <span className="text-[10px] text-zinc-500 mb-1">{msg.type === 'log' ? 'SYSTEM PROCESS' : 'AGENT REPLY'}</span>}

                  <div className={`
                    px-3 py-2 rounded-lg 
                    ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground font-sans text-sm shadow-md'
                      : msg.type === 'log'
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-sans'
                    }
                  `}>
                    {msg.type === 'log' && <span className="text-emerald-500 mr-2">➜</span>}
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {/* Pulsing indicator for active agent */}
            <div className="flex gap-3 opacity-50">
              <div className="mt-1 shrink-0 size-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center animate-pulse">
                <Terminal className="size-3" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs w-2/3">
                <span className="text-emerald-500 mr-2 animate-pulse">_</span>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-zinc-900 border-t border-zinc-800">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <Terminal className="absolute left-3 size-4 text-zinc-500" />
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Instruct agent (e.g. 'Re-scan open ports')"
                className="w-full bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 pl-9 pr-12 focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary shadow-inner"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1 size-8 hover:bg-zinc-800 hover:text-white text-zinc-400"
                disabled={!chatInput.trim()}
              >
                <Send className="size-4" />
              </Button>
            </form>
            <p className="text-[10px] text-center text-zinc-500 mt-2 font-sans">Everything updates dynamically. Chat & Log streams synced.</p>
          </div>
        </div>

      </div>

    </div>
  )
}
