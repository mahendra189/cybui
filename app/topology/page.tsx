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

/* --- Custom Node Types --- */

// Asset Node (e.g. Server, Gateway)
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
          <h3 className="text-xs font-bold font-mono">{data.id}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{data.ip}</p>
        </div>
      </div>
      
      <div className="text-xs font-medium text-foreground">{data.name}</div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <Button variant="secondary" size="sm" className="h-6 text-[10px]" asChild>
          <Link href={`/assets/${data.id}`}>View</Link>
        </Button>
        <Button variant="destructive" size="sm" className="h-6 text-[10px]">Isolate</Button>
      </div>
    </div>
  )
}

// Service Node (e.g. Ports, HTTP, SSH)
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

/* --- Mock Data Initializer --- */
import { initialNodes, initialEdges } from "@/lib/mock-data"

export default function TopologyPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 shrink-0 z-10 relative">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Network Topology</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live infrastructure map. Review dependencies, trace exposed services, and pinpoint risks instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <ScanLine className="size-4" /> Rescan Network
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/assets">
              List View <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* React Flow Container */}
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
