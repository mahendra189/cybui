"use client"

import React, { useCallback, useEffect } from "react"
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
import { Wifi, Globe, Activity, ScanLine, Lock, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useGlobalData } from "@/app/context/GlobalDataContext"
import { getRadialLayout, getHierarchicalLayout, getGridLayout } from "@/lib/topology-layouts"

/* --- Custom Node Types --- */

// Router/Gateway Node - placed in center
const RouterNode = ({ data }: { data: any }) => {
  return (
    <div className="relative rounded-full border-4 border-amber-500/80 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-4 w-24 h-24 shadow-lg shadow-amber-500/30 flex items-center justify-center">
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
      <Handle type="source" position={Position.Top} className="!bg-amber-500" />
      <Handle type="source" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
      
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

  // Generate network topology from devices (targets)
  const { globalNodes, globalEdges } = React.useMemo(() => {
    // Filter devices by network/network interface
    let devices = dbData.targets || [];
    
    if (selectedNetwork !== "all") {
      devices = devices.filter(d => d.network === selectedNetwork || d.interface === selectedNetwork);
    }

    if (devices.length === 0) {
      return { globalNodes: [], globalEdges: [] };
    }

    // Find router - heuristic: device with .1 IP or highest probability router
    const routerDevice = devices.find(d => d.ip && d.ip.endsWith('.1')) || 
                         devices.find(d => d.device_type?.toLowerCase().includes('router') || d.device_type?.toLowerCase().includes('gateway')) ||
                         devices[0];

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

    return { globalNodes: layoutResult.nodes, globalEdges: layoutResult.edges };
  }, [dbData.targets, selectedNetwork, layoutMode]);

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

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 shrink-0 z-10 relative px-4 md:px-8 top-4 md:top-8 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-semibold tracking-tight">Network Topology</h1>
          <p className="text-sm text-muted-foreground mt-1 bg-background/80 backdrop-blur rounded px-1 py-0.5 inline-block">
            Wi-Fi/Router in center with connected devices arranged in a circle.
          </p>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <select 
            className="flex h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
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

      <div className="flex-1 w-full border rounded-xl overflow-hidden relative">
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
          </div>
        </div>
      </div>
    </div>
  )
}
