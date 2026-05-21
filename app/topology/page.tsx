"use client"

import React from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Connection,
  Edge,
  Node,
} from "@xyflow/react"
import "@xyflow/react/dist/base.css"
import Link from "next/link"
import { Wifi, Globe, Activity, ScanLine, ArrowUp, ArrowDown, ActivitySquare, Network } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGlobalData } from "@/app/context/GlobalDataContext"
import { getRadialLayout, getHierarchicalLayout, getGridLayout } from "@/lib/topology-layouts"

/* --- Custom Node Types --- */

// Router/Gateway Node - placed in center
const RouterNode = ({ data }: { data: any }) => {
  return (
    <div className="relative rounded-full border-4 border-amber-500/80 bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-4 w-24 h-24 shadow-lg shadow-amber-500/30 flex items-center justify-center">
      <Handle type="source" position={Position.Bottom} className="bg-amber-500!" />
      <Handle type="source" position={Position.Top} className="bg-amber-500!" />
      <Handle type="source" position={Position.Left} className="bg-amber-500!" />
      <Handle type="source" position={Position.Right} className="bg-amber-500!" />
      
      <div className="flex flex-col items-center gap-1">
        <Wifi className="size-6 text-amber-600" />
        <div className="text-center">
          <h3 className="text-xs font-bold font-mono">{data.id}</h3>
          <p className="text-[9px] text-amber-700 font-mono">{data.ip}</p>
        </div>
      </div>
    </div>
  )
}

// Device Node - connected to router
const DeviceNode = ({ data }: { data: any }) => {
  const isAlive = data.alive;
  const borderClass = isAlive ? "border-emerald-500/60" : "border-gray-500/60";
  const bgClass = isAlive ? "bg-emerald-50 dark:bg-emerald-950" : "bg-gray-50 dark:bg-gray-950";
  const iconBgClass = isAlive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-600";
  const handleColor = isAlive ? "!bg-emerald-500" : "!bg-gray-500";
  
  return (
    <div className={`relative rounded-lg border-2 ${borderClass} ${bgClass} p-3 w-40 shadow-md`}>
      <Handle type="target" position={Position.Top} className={handleColor} />
      <Handle type="source" position={Position.Bottom} className={handleColor} />
      
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded ${iconBgClass}`}>
          <Globe className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold font-mono truncate">{data.hostname || data.id}</h3>
          <p className="text-[9px] text-muted-foreground truncate">{data.ip}</p>
          {data.os_guess && <p className="text-[8px] text-muted-foreground truncate">{data.os_guess}</p>}
        </div>
      </div>
      
      {data.open_ports && data.open_ports.length > 0 && (
        <div className="mt-2 text-[8px] text-muted-foreground">
          <span className="font-semibold">Ports:</span> {data.open_ports.slice(0, 3).join(", ")}{data.open_ports.length > 3 ? "..." : ""}
        </div>
      )}
      
      <div className="mt-2 flex gap-1">
        <Button variant="secondary" size="sm" className="h-5 text-[9px] flex-1" asChild>
          <Link href={`/assets/${data.realId}`}>View</Link>
        </Button>
      </div>
    </div>
  )
}

const nodeTypes = {
  router: RouterNode,
  device: DeviceNode,
}

export default function TopologyPage() {
  const { data: dbData } = useGlobalData()
  const [selectedNetwork, setSelectedNetwork] = React.useState("all")
  const [layoutMode, setLayoutMode] = React.useState<"radial" | "hierarchical" | "grid">("radial")
  const [packetFeed, setPacketFeed] = React.useState<any[]>([])
  const [movingPacket, setMovingPacket] = React.useState<any | null>(null)
  const [motionProgress, setMotionProgress] = React.useState(0)
  const hasSeededPacketsRef = React.useRef(false)
  const bubblePositionsRef = React.useRef(new Map<string, { x: number; y: number }>());
  const discoveryPoolRef = React.useRef<string[]>([])
  const motionFrameRef = React.useRef<number | null>(null)
  const motionTimeoutRef = React.useRef<number | null>(null)

  const networkDevices = React.useMemo(() => {
    let devices = dbData.targets || []

    if (selectedNetwork !== "all") {
      devices = devices.filter(d => d.network === selectedNetwork || d.interface === selectedNetwork)
    }

    return devices
  }, [dbData.targets, selectedNetwork])

  // Generate network topology from devices (targets)
  const { globalNodes, globalEdges, routerDevice } = React.useMemo(() => {
    const devices = networkDevices

    if (devices.length === 0) {
      console.warn("[Topology] No devices found!");
      return { globalNodes: [], globalEdges: [], routerDevice: null };
    }

    // Find router - heuristic: device with .1 IP or highest probability router
    const routerDevice = devices.find(d => d.ip && d.ip.endsWith('.1')) || 
                         devices.find(d => d.device_type?.toLowerCase().includes('router') || d.device_type?.toLowerCase().includes('gateway')) ||
                         devices.find(d => d.device_type?.toLowerCase().includes('access point')) ||
                         devices[0];

    if (!routerDevice) {
      console.error("[Topology] No router device found!");
      return { globalNodes: [], globalEdges: [] };
    }

    console.log("[Topology] Router identified:", {
      ip: routerDevice.ip,
      hostname: routerDevice.hostname,
      device_type: routerDevice.device_type,
      mac: routerDevice.mac
    });

    const routerNode: Node = {
      id: `router-${routerDevice.ip}`,
      type: "router",
      position: { x: 0, y: 0 }, // Center position
      data: {
        id: routerDevice.hostname || routerDevice.ip,
        ip: routerDevice.ip,
        mac: routerDevice.mac,
        device_type: routerDevice.device_type,
        realId: routerDevice._id || routerDevice.ip,
      },
    };

    // Get other devices to arrange around router
    const otherDevices = devices.filter(d => d.ip !== routerDevice.ip);

    // Apply selected layout algorithm
    let layoutResult;
    switch (layoutMode) {
      case "hierarchical":
        layoutResult = getHierarchicalLayout(otherDevices, routerNode);
        break;
      case "grid":
        layoutResult = getGridLayout(otherDevices, routerNode);
        break;
      case "radial":
      default:
        layoutResult = getRadialLayout(otherDevices, routerNode);
        break;
    }

    console.log("[Topology] Final nodes:", layoutResult.nodes.length, "Final edges:", layoutResult.edges.length);
    if (layoutResult.nodes.length > 0) {
      console.log("[Topology] All node IDs:", layoutResult.nodes.map(n => ({ id: n.id, type: n.type })));
    }
    return { globalNodes: layoutResult.nodes, globalEdges: layoutResult.edges, routerDevice };
  }, [networkDevices, layoutMode]);

  const mainPacketDevice = React.useMemo(() => routerDevice || networkDevices[0] || null, [routerDevice, networkDevices])

  const createBubblePosition = React.useCallback(() => {
    const angle = Math.random() * Math.PI * 2
    const radius = 18 + Math.random() * 28
    const x = Math.min(88, Math.max(12, 50 + Math.cos(angle) * radius))
    const y = Math.min(88, Math.max(12, 50 + Math.sin(angle) * radius))
    return { x, y }
  }, [])

  const getBubblePosition = React.useCallback((peerKey: string) => {
    const existing = bubblePositionsRef.current.get(peerKey)
    if (existing) return existing

    const position = createBubblePosition()
    bubblePositionsRef.current.set(peerKey, position)
    return position
  }, [createBubblePosition])

  // Get unique networks for filtering
  const uniqueNetworks = React.useMemo(() => {
    const networks = new Set<string>();
    dbData.targets?.forEach(t => {
      if (t.network) networks.add(t.network);
      if (t.interface) networks.add(t.interface);
    });
    return Array.from(networks);
  }, [dbData.targets]);

  const targetNodes = React.useMemo(() => {
    return globalNodes;
  }, [globalNodes])

  const targetEdges = React.useMemo(() => {
    const nodeIds = new Set(targetNodes.map(n => n.id))
    return globalEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [targetNodes, globalEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(targetNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(targetEdges)

  const onConnect = React.useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  React.useEffect(() => {
    setNodes(targetNodes)
    setEdges(targetEdges)
  }, [targetNodes, targetEdges, setNodes, setEdges])

  const createPacket = React.useCallback(() => {
    if (!mainPacketDevice || networkDevices.length === 0) return null

    const protocols = ["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS"]
    const direction = Math.random() > 0.5 ? "in" : "out"
    const hubLabel = mainPacketDevice.hostname || mainPacketDevice.ip
    const hubAddress = mainPacketDevice.ip
    const internalPeers = networkDevices.filter(device => device.ip !== mainPacketDevice.ip)
    const useExternalPeer = Math.random() > 0.55 || internalPeers.length === 0
    const peerDevice = useExternalPeer ? null : internalPeers[Math.floor(Math.random() * internalPeers.length)]
    const discoveryPool = discoveryPoolRef.current
    const peerIp = peerDevice?.ip || discoveryPool[Math.floor(Math.random() * discoveryPool.length)] || `${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 200) + 20}`
    const peerLabel = peerDevice?.hostname || peerDevice?.ip || `New Device ${peerIp}`

    return {
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString(),
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      direction,
      hubLabel,
      hubAddress,
      peerKey: peerIp,
      peerLabel,
      peerAddress: peerIp,
      source: direction === "out" ? `${hubLabel} (${hubAddress})` : `${peerLabel} (${peerIp})`,
      destination: direction === "out" ? `${peerLabel} (${peerIp})` : `${hubLabel} (${hubAddress})`,
      size: Math.floor(Math.random() * 1400) + 64,
      state: Math.random() > 0.7 ? "retransmit" : "flowing",
    }
  }, [mainPacketDevice, networkDevices])

  React.useEffect(() => {
    if (networkDevices.length === 0) {
      setPacketFeed([])
      hasSeededPacketsRef.current = false
      discoveryPoolRef.current = []
      bubblePositionsRef.current.clear()
      setMovingPacket(null)
      setMotionProgress(0)
      return
    }

    if (!hasSeededPacketsRef.current && packetFeed.length === 0) {
      const seedPackets = Array.from({ length: 6 }, () => createPacket()).filter(Boolean)
      setPacketFeed(seedPackets as any[])
      hasSeededPacketsRef.current = true
    }

    const interval = setInterval(() => {
      const packet = createPacket()
      if (!packet) return

      setPacketFeed(prev => [packet, ...prev].slice(0, 48))
      setMovingPacket(packet)
    }, 850)

    return () => clearInterval(interval)
  }, [createPacket, networkDevices.length, packetFeed.length])

  React.useEffect(() => {
    setPacketFeed([])
    hasSeededPacketsRef.current = false
    bubblePositionsRef.current.clear()
    discoveryPoolRef.current = Array.from({ length: 12 }, () => {
      const second = Math.floor(Math.random() * 220) + 10
      return `10.${Math.floor(Math.random() * 240) + 10}.${Math.floor(Math.random() * 240) + 10}.${second}`
    })
    setMovingPacket(null)
    setMotionProgress(0)
  }, [selectedNetwork])

  React.useEffect(() => {
    if (!movingPacket) return

    if (motionFrameRef.current !== null) {
      cancelAnimationFrame(motionFrameRef.current)
    }
    if (motionTimeoutRef.current !== null) {
      window.clearTimeout(motionTimeoutRef.current)
    }

    const duration = 520
    const start = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setMotionProgress(progress)

      if (progress < 1) {
        motionFrameRef.current = requestAnimationFrame(animate)
      } else {
        motionTimeoutRef.current = window.setTimeout(() => {
          setMovingPacket(null)
          setMotionProgress(0)
        }, 140)
      }
    }

    motionFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (motionFrameRef.current !== null) {
        cancelAnimationFrame(motionFrameRef.current)
      }
      if (motionTimeoutRef.current !== null) {
        window.clearTimeout(motionTimeoutRef.current)
      }
    }
  }, [movingPacket])

  const packetMapPeers = React.useMemo(() => {
    const peerMap = new Map<string, any>()

    packetFeed.forEach((pkt) => {
      if (!pkt.peerKey) return

      const existing = peerMap.get(pkt.peerKey) || {
        key: pkt.peerKey,
        label: pkt.peerLabel,
        address: pkt.peerAddress,
        count: 0,
        firstSeen: pkt.time,
        lastSeen: pkt.time,
        latestPacketId: pkt.id,
        latestDirection: pkt.direction,
        protocols: new Set<string>(),
      }

      existing.count += 1
      existing.lastSeen = pkt.time
      existing.latestPacketId = pkt.id
      existing.latestDirection = pkt.direction
      existing.protocols.add(pkt.protocol)
      peerMap.set(pkt.peerKey, existing)
    })

    const peers = Array.from(peerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return peers.map((peer, index) => {
      const position = getBubblePosition(peer.key)
      return {
        ...peer,
        x: position.x,
        y: position.y,
        bubbleSize: Math.min(58 + peer.count * 8, 126),
      }
    })
  }, [getBubblePosition, packetFeed])

  const activePacketPeer = React.useMemo(() => {
    if (!movingPacket) return null
    return packetMapPeers.find(peer => peer.key === movingPacket.peerKey) || null
  }, [movingPacket, packetMapPeers])

  const packetStats = React.useMemo(() => {
    const incoming = packetFeed.filter(pkt => pkt.direction === "in").length
    const outgoing = packetFeed.filter(pkt => pkt.direction === "out").length
    const avgSize = packetFeed.length > 0
      ? Math.round(packetFeed.reduce((sum, pkt) => sum + pkt.size, 0) / packetFeed.length)
      : 0

    return { incoming, outgoing, avgSize }
  }, [packetFeed])

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 shrink-0 z-10 relative px-4 md:px-8 top-4 md:top-8 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-semibold tracking-tight">Network Topology</h1>
          <p className="text-sm text-muted-foreground mt-1 bg-background/80 backdrop-blur rounded px-1 py-0.5 inline-block">
            Wi-Fi/Router in center with {globalNodes.length} device{globalNodes.length !== 1 ? 's' : ''} arranged in a circle.
          </p>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <select 
            className="flex h-9 w-50 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            <option value="all">All Networks</option>
            {uniqueNetworks.map((network) => (
              <option key={network} value={network}>{network}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 border">
            <Button 
              variant={layoutMode === "radial" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLayoutMode("radial")}
              title="Circular layout with router in center"
            >
              Radial
            </Button>
            <Button 
              variant={layoutMode === "hierarchical" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLayoutMode("hierarchical")}
              title="Hierarchical tree layout"
            >
              Tree
            </Button>
            <Button 
              variant={layoutMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLayoutMode("grid")}
              title="Grid layout"
            >
              Grid
            </Button>
          </div>

          <Button variant="outline" className="gap-2 h-9">
            <ScanLine className="size-4" /> Rescan Network
          </Button>
        </div>
      </div>

      <Tabs defaultValue="topology" className="flex flex-1 min-h-0 flex-col">
        <div className="mb-4 shrink-0">
          <TabsList className="bg-muted/60 border">
            <TabsTrigger value="topology" className="gap-2">
              <Network className="size-4" /> Topology
            </TabsTrigger>
            <TabsTrigger value="packets" className="gap-2">
              <Wifi className="size-4" /> Packets
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="topology" className="m-0 flex-1 min-h-0">
          <div className="flex-1 w-full border rounded-xl overflow-hidden relative h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.5}
              maxZoom={2}
              className="bg-muted/5"
            >
              <Controls position="bottom-left" />
              <MiniMap 
                zoomable 
                pannable 
                nodeColor={(node) => {
                  if (node.type === 'router') return '#b45309'
                  if (node.type === 'device') {
                    if (node.data.alive) return '#059669'
                    return '#6b7280'
                  }
                  return '#94a3b8'
                }} 
                className="rounded-lg shadow-sm border bg-background"
              />
              <Background gap={24} size={2} color="#888" className="opacity-20" />
            </ReactFlow>

            {/* Info Panel */}
            <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur border rounded-lg p-4 shadow-lg max-w-xs">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Network Status</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-amber-500" />
                  <span>Router/Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500" />
                  <span>Connected Device (Active)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-gray-500" />
                  <span>Device (Offline)</span>
                </div>
                <div className="border-t border-muted pt-2 mt-2">
                  <div className="text-xs text-muted-foreground">
                    <div>Total Devices: <span className="font-mono font-semibold text-foreground">{globalNodes.length}</span></div>
                    <div>From Targets: <span className="font-mono font-semibold text-foreground">{dbData.targets?.length || 0}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="packets" className="m-0 flex-1 min-h-0">
          <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <Card className="border shadow-sm bg-background/90 overflow-hidden flex flex-col min-h-0">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ActivitySquare className="size-5 text-primary" /> Realtime Packet Flow
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Live network traffic sampled from the active topology view.</p>
                  </div>
                  <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-4">
                <div className="mb-4 rounded-2xl border bg-background/95 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">Packet Discovery Map</div>
                      <p className="text-xs text-muted-foreground">Bubbles appear at random positions, grow with packet count, and only draw a path while a packet is moving.</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {packetMapPeers.length} discovered
                    </Badge>
                  </div>

                  <div className="relative h-96 overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.02),transparent)]">
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {activePacketPeer && movingPacket && (
                        <g>
                          <line
                            x1="50"
                            y1="50"
                            x2={50 + (activePacketPeer.x - 50) * motionProgress}
                            y2={50 + (activePacketPeer.y - 50) * motionProgress}
                            stroke={movingPacket.direction === "in" ? "rgba(59,130,246,0.95)" : "rgba(245,158,11,0.95)"}
                            strokeWidth="0.7"
                            strokeLinecap="round"
                            strokeDasharray="0.9 0.7"
                            style={{ opacity: 0.95 }}
                          />
                          <circle
                            cx={50 + (activePacketPeer.x - 50) * motionProgress}
                            cy={50 + (activePacketPeer.y - 50) * motionProgress}
                            r={1.25}
                            fill={movingPacket.direction === "in" ? "rgb(59,130,246)" : "rgb(245,158,11)"}
                            className="animate-pulse"
                          />
                        </g>
                      )}
                    </svg>

                    <div className="absolute inset-0">
                      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/10 shadow-lg shadow-primary/20">
                        <div className="flex flex-col items-center text-center">
                          <Wifi className="size-6 text-primary" />
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Main</div>
                          <div className="max-w-20 truncate text-[10px] font-mono text-foreground/90">
                            {mainPacketDevice ? (mainPacketDevice.hostname || mainPacketDevice.ip) : "Hub"}
                          </div>
                        </div>
                        <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
                      </div>

                      {packetMapPeers.map((peer) => {
                        const isLatest = movingPacket?.peerKey === peer.key
                        return (
                          <div
                            key={peer.key}
                            className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-all duration-500 ${isLatest ? "scale-105" : "scale-100"}`}
                            style={{ left: `${peer.x}%`, top: `${peer.y}%`, width: `${peer.bubbleSize}px`, height: `${peer.bubbleSize}px` }}
                          >
                            <div className={`relative flex h-full w-full items-center justify-center rounded-full border bg-background/95 shadow-md ${isLatest ? "border-primary/50 ring-4 ring-primary/15" : "border-border/70"}`}>
                              <div className={`absolute -inset-2 rounded-full border ${isLatest ? "border-primary/30 animate-ping" : "border-border/20"}`} />
                              <div className="flex flex-col items-center gap-0.5 px-2">
                                <div className="max-w-16 truncate text-[10px] font-semibold">{peer.label}</div>
                                <div className="max-w-16 truncate text-[9px] font-mono text-muted-foreground">{peer.address}</div>
                                <Badge variant="secondary" className="mt-1 h-4 rounded-full px-1.5 text-[9px] leading-none">
                                  {peer.count}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-2 max-w-24 text-[9px] uppercase tracking-wide text-muted-foreground">
                              {peer.count === 1 ? "New bubble" : `${peer.count} packets`}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 mb-4">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Packets Seen</div>
                    <div className="mt-1 text-2xl font-bold">{packetFeed.length}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Inbound / Outbound</div>
                    <div className="mt-1 text-2xl font-bold">{packetStats.incoming} / {packetStats.outgoing}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Avg Size</div>
                    <div className="mt-1 text-2xl font-bold">{packetStats.avgSize}B</div>
                  </div>
                </div>

                <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col min-h-96 h-full">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Activity className="size-4 text-primary animate-pulse" />
                      Packet Stream
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPacketFeed([])}
                      className="h-8"
                    >
                      Clear Stream
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%)]">
                    {packetFeed.length > 0 ? packetFeed.map((pkt) => (
                      <div key={pkt.id} className="grid gap-2 rounded-lg border bg-muted/20 px-3 py-3 md:grid-cols-[auto,1fr,auto] md:items-center">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${pkt.direction === 'in' ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'}`}>
                          {pkt.direction === 'in' ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
                          {pkt.direction}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <span className="font-mono text-muted-foreground text-xs">{pkt.time}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">{pkt.protocol}</Badge>
                            <span className="text-xs text-muted-foreground">{pkt.state}</span>
                          </div>
                          <div className="mt-1 font-mono text-xs leading-5 text-foreground wrap-break-word">
                            <span className="text-primary">{pkt.source}</span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span>{pkt.destination}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                          <Badge variant="secondary" className="font-mono text-[10px]">{pkt.size}B</Badge>
                          <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            flowing
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="flex h-full min-h-64 items-center justify-center text-center text-muted-foreground">
                        <div>
                          <div className="mx-auto mb-3 size-12 rounded-full bg-muted flex items-center justify-center">
                            <Wifi className="size-5" />
                          </div>
                          <p className="font-medium">No packets captured yet.</p>
                          <p className="text-sm">The stream will populate as soon as network activity is sampled.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 content-start">
              <Card className="border shadow-sm bg-background/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Flow Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scope</div>
                    <div className="mt-1 font-medium">{selectedNetwork === 'all' ? 'All active networks' : selectedNetwork}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tracked Devices</div>
                    <div className="mt-1 font-medium">{networkDevices.length}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Gateway</div>
                    <div className="mt-1 font-mono text-xs wrap-break-word">{routerDevice?.hostname || routerDevice?.ip || 'Unavailable'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-background/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Packet Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Traffic is simulated from the live topology data so the feed updates in real time without a backend capture service.</p>
                  <p>Hook this tab to a packet source later if you want the rows to reflect a real stream instead of sampled flow.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
