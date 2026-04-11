"use client"

import React, { useCallback } from "react"
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
import "@xyflow/react/dist/style.css"
import Link from "next/link"
import { Server, Globe, Lock, Unlock, Database, Activity, ScanLine, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useGlobalData } from "@/app/context/GlobalDataContext"

/* --- Custom Node Types --- */

const AssetNode = ({ data }: { data: any }) => {
  return (
    <div className="relative rounded-lg border-2 border-primary/50 bg-card p-3 w-48 shadow-lg shadow-primary/5">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-primary/10 text-primary">
          <Server className="size-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold font-mono truncate max-w-[120px]">{data.id}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{data.ip}</p>
        </div>
      </div>
      
      <div className="text-xs font-medium text-foreground">{data.name}</div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <Button variant="secondary" size="sm" className="h-6 text-[10px]" asChild>
          <Link href={`/assets/${data.realId}`}>View</Link>
        </Button>
        <Button variant="destructive" size="sm" className="h-6 text-[10px]">Isolate</Button>
      </div>
    </div>
  )
}

const ServiceNode = ({ data }: { data: any }) => {
  const isCritical = data.risk >= 75
  const isWarning = data.risk >= 40 && data.risk < 75

  const ringColor = isCritical ? "ring-destructive/50" : isWarning ? "ring-amber-500/50" : "ring-emerald-500/50"
  const bgColor = isCritical ? "bg-destructive/10 border-destructive/30" : isWarning ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"
  const textColor = isCritical ? "text-destructive" : isWarning ? "text-amber-500" : "text-emerald-500"

  const IconMap: Record<string, any> = {
    HTTP: Globe,
    SSH: Lock,
    Database: Database,
    Unencrypted: Unlock
  }
  const Icon = IconMap[data.type] || Activity

  return (
    <div className={`relative rounded-full border-2 p-2 px-4 shadow-sm backdrop-blur flex items-center gap-2 ring-4 ${ringColor} ${bgColor}`}>
      <Handle type="target" position={Position.Top} className={`!w-2 !h-2 !bg-foreground`} />
      <Handle type="source" position={Position.Bottom} className={`!w-2 !h-2 !bg-foreground`} />
      
      <Icon className={`size-4 ${textColor}`} />
      <div className="flex flex-col">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>{data.label}</span>
        <span className="text-[9px] text-muted-foreground font-mono">PORT {data.port} / {data.risk} RSK</span>
      </div>
    </div>
  )
}

const nodeTypes = {
  asset: AssetNode,
  service: ServiceNode,
}

export default function TopologyPage() {
  const { data: dbData } = useGlobalData()
  const [selectedTarget, setSelectedTarget] = React.useState("all")

  // Generate dynamic topology mapping
  const { globalNodes, globalEdges } = React.useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Grid Tracker
    let assetCount = 0;
    const parentChildrenMap: Record<string, number> = {};

    dbData.assets.forEach((asset, index) => {
      const assetId = asset.deviceName || asset.name || asset.id || `asset-${index}`;
      
      newNodes.push({
        id: assetId,
        type: "asset",
        // Simple Grid Layout
        position: { x: (assetCount % 3) * 350 + 100, y: Math.floor(assetCount / 3) * 250 + 50 },
        data: {
          id: assetId,
          realId: asset._id || asset.id || assetId,
          name: asset.os || asset.type || "Unknown Host OS",
          ip: asset.ip || "10.0.x.x",
          targetId: asset.targetId || "all" 
        }
      });
      assetCount++;
    });

    // Map Services -> attach to assets
    dbData.services.forEach((service, index) => {
      const serviceId = `svc-${service.name}-${index}`;
      let parentId = service.runningOn;
      
      if (!parentId || !newNodes.find(n => n.id === parentId)) {
         parentId = dbData.assets[0]?.deviceName || `asset-0`; // Fallback parent
      }

      const parentNode = newNodes.find(n => n.id === parentId);
      const px = parentNode ? parentNode.position.x : 0;
      const py = parentNode ? parentNode.position.y : 0;

      parentChildrenMap[parentId] = (parentChildrenMap[parentId] || 0) + 1;
      const offsetX = (parentChildrenMap[parentId] - 1.5) * 120;

      newNodes.push({
        id: serviceId,
        type: "service",
        position: { x: px + 40 + offsetX, y: py + 180 }, 
        data: {
          label: service.name,
          type: service.name.includes("db") ? "Database" : service.name.includes("ssh") ? "SSH" : "HTTP",
          port: service.port || 80,
          risk: service.name.includes("ssh") ? 85 : 25,
          targetId: parentNode?.data.targetId || "all"
        }
      });

      newEdges.push({
        id: `edge-${parentId}-${serviceId}`,
        source: parentId,
        target: serviceId,
        type: "smoothstep",
        animated: serviceId.includes("db") ? true : false,
        style: { stroke: '#4b5563', strokeWidth: 2 }
      });
    });

    // Map Ports -> attach to assets
    dbData.ports.forEach((port, index) => {
      const portId = `port-${port.port}-${index}`;
      const parentId = dbData.assets[index % (dbData.assets.length || 1)]?.deviceName || `asset-0`;
      
      const parentNode = newNodes.find(n => n.id === parentId);
      if (!parentNode) return;

      const px = parentNode.position.x;
      const py = parentNode.position.y;

      parentChildrenMap[parentId] = (parentChildrenMap[parentId] || 0) + 1;
      const offsetX = (parentChildrenMap[parentId] - 2) * 120;

      newNodes.push({
        id: portId,
        type: "service",
        position: { x: px + 40 + offsetX, y: py + 180 }, 
        data: {
          label: port.service || `Port ${port.port}`,
          type: port.service === "https" ? "HTTP" : "Unencrypted",
          port: port.port,
          risk: port.state === "open" ? 50 : 10,
          targetId: parentNode.data.targetId
        }
      });

      newEdges.push({
        id: `edge-${parentId}-${portId}`,
        source: parentId,
        target: portId,
        type: "straight",
        style: { strokeDasharray: '4', stroke: '#9ca3af' }
      });
    });

    return { globalNodes: newNodes, globalEdges: newEdges };
  }, [dbData.assets, dbData.services, dbData.ports]);


  const targetNodes = React.useMemo(() => {
    return globalNodes.filter(n => selectedTarget === "all" || n.data.targetId === selectedTarget)
  }, [selectedTarget, globalNodes])

  const targetEdges = React.useMemo(() => {
    const nodeIds = new Set(targetNodes.map(n => n.id))
    return globalEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [targetNodes, selectedTarget, globalEdges])

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
            Live mapped infrastructure dependencies.
          </p>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <select 
            className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
          >
            <option value="all">Global View (All Targets)</option>
            {dbData.targets.map((t: any) => (
              <option key={t._id || t.id} value={t._id || t.id}>{t.organizationName || t.name}</option>
            ))}
          </select>
          <Button variant="outline" className="gap-2 h-9">
            <ScanLine className="size-4" /> Rescan Network
          </Button>
          <Button className="gap-2 h-9" asChild>
            <Link href="/assets">
              List View <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full border rounded-xl overflow-hidden bg-dot-black/[0.2] dark:bg-dot-white/[0.2] relative">
        <div className="absolute top-4 left-4 z-10 flex gap-4 bg-background/80 backdrop-blur border rounded-md p-2 px-4 shadow-sm text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-destructive/80 ring-2 ring-destructive/30" /> High Risk
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-amber-500/80 ring-2 ring-amber-500/30" /> Elevated
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-emerald-500/80 ring-2 ring-emerald-500/30" /> Secure
          </div>
        </div>

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
          maxZoom={1.5}
          className="bg-muted/10"
        >
          <Controls />
          <MiniMap 
            zoomable 
            pannable 
            nodeColor={(node) => {
              if (node.type === 'asset') return 'hsl(var(--primary))'
              if (node.type === 'service') {
                if (node.data.risk >= 75) return '#ef4444'
                if (node.data.risk >= 40) return '#f59e0b'
                return '#10b981'
              }
              return 'hsl(var(--muted))'
            }} 
            className="rounded-lg shadow-sm border bg-background"
          />
          <Background gap={24} size={2} color="#888" className="opacity-20" />
        </ReactFlow>
      </div>
    </div>
  )
}
