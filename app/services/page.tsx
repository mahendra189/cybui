"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Server, Search, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { servicesData } from "@/lib/mock-data"

function getRiskColor(score: number) {
  if (score >= 75) return "text-destructive"
  if (score >= 40) return "text-amber-500"
  return "text-emerald-500"
}

function getRiskBg(score: number) {
  if (score >= 75) return "bg-destructive/20"
  if (score >= 40) return "bg-amber-500/20"
  return "bg-emerald-500/20"
}

// Inline SVG sparkline to avoid heavy chart dependencies
function Sparkline({ data, score }: { data: number[], score: number }) {
  const max = Math.max(...data, 100);
  const min = 0;
  const range = max - min;
  const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - ((val - min) / range) * 100}`).join(" ");
  
  const strokeColor = score >= 75 ? "stroke-destructive" : score >= 40 ? "stroke-amber-500" : "stroke-emerald-500";

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-8 overflow-visible" preserveAspectRatio="none">
      <polyline 
        points={points} 
        fill="none" 
        strokeWidth="12" 
        className={`${strokeColor} transition-all duration-500`} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  )
}

export default function ServicesPage() {
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = React.useState("")

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredServices = React.useMemo(() => {
    return servicesData.filter(
      (s) => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.version.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze risk scores, active trends, and discover dependencies per service.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services..."
            className="w-full bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Aggregate Risk</TableHead>
              <TableHead>Risk Trend</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Assets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No services found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <React.Fragment key={service.id}>
                  {/* Main Row */}
                  <TableRow 
                    className="cursor-pointer group hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRow(service.id)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-6 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                        {expandedRows[service.id] ? (
                          <ChevronDown className="size-4 transition-transform" />
                        ) : (
                          <ChevronRight className="size-4 transition-transform" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{service.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{service.type} • {service.version}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold tabular-nums ${getRiskColor(service.riskScore)}`}>
                          {service.riskScore}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full ${getRiskBg(service.riskScore).replace('/20', '')}`}
                            style={{ width: `${service.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Sparkline data={service.trendData} score={service.riskScore} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="size-3" />
                        {service.lastSeen}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="px-2 py-0.5 pointer-events-none bg-background">
                        {service.assets.length} Assets
                      </Badge>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Content Row */}
                  {expandedRows[service.id] && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-0">
                      <TableCell colSpan={6} className="p-0 border-b-0">
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200 p-4 pl-[74px]">
                          <div className="rounded-lg border bg-background overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase">
                                <tr>
                                  <th className="px-4 py-3 font-medium text-left w-1/4">Asset ID</th>
                                  <th className="px-4 py-3 font-medium text-left w-1/4">Network IP</th>
                                  <th className="px-4 py-3 font-medium text-left w-1/4">Asset Hostname</th>
                                  <th className="px-4 py-3 font-medium text-right w-1/4">Individual Risk</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {service.assets.map((asset) => (
                                  <tr key={asset.id} className="hover:bg-muted/60 transition-colors">
                                    <td className="px-4 py-3">
                                      <Link href={`/assets/${asset.id}`} className="font-mono text-xs text-primary hover:underline font-medium flex items-center gap-2">
                                        <Server className="size-3 text-muted-foreground" />
                                        {asset.id}
                                      </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">{asset.ip}</td>
                                    <td className="px-4 py-3 font-medium text-foreground/80">{asset.name}</td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className={`h-1.5 w-8 overflow-hidden rounded-full bg-secondary hidden sm:flex`}>
                                          <div
                                            className={`h-full rounded-full ${getRiskBg(asset.assetRisk).replace('/20', '')}`}
                                            style={{ width: `${asset.assetRisk}%` }}
                                          />
                                        </div>
                                        <span className={`font-bold tabular-nums text-xs ${getRiskColor(asset.assetRisk)}`}>
                                          {asset.assetRisk}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
