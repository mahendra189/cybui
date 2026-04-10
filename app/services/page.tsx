"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Server, ShieldAlert, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const servicesData = [
  {
    id: "SRV-HTTP",
    name: "HTTP / Web Server",
    type: "HTTP",
    version: "Nginx 1.18.0",
    risk: "Medium",
    assets: [
      { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205" },
      { id: "AST-004", name: "Customer Portal Frontend", ip: "10.42.1.210" },
    ],
  },
  {
    id: "SRV-SSH",
    name: "Secure Shell",
    type: "SSH",
    version: "OpenSSH 8.9p1",
    risk: "Low",
    assets: [
      { id: "AST-001", name: "Primary Database Server", ip: "192.168.1.10" },
      { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205" },
      { id: "AST-005", name: "Data Lake Storage", ip: "192.168.2.55" },
    ],
  },
  {
    id: "SRV-PSQL",
    name: "PostgreSQL Database",
    type: "Database",
    version: "PostgreSQL 14.5",
    risk: "Low",
    assets: [
      { id: "AST-001", name: "Primary Database Server", ip: "192.168.1.10" },
    ],
  },
  {
    id: "SRV-REDIS",
    name: "Redis KV Store",
    type: "Cache",
    version: "Redis 6.2.6",
    risk: "High",
    assets: [
      { id: "AST-003", name: "Legacy Auth Service", ip: "192.168.1.50" },
    ],
  },
]

export default function ServicesPage() {
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Services Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A summarized view of discovered services, their versions, and associated infrastructure.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Service Name</TableHead>
              <TableHead>Protocol / Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Assets Associated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicesData.map((service) => (
              <React.Fragment key={service.id}>
                {/* Main Row */}
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleRow(service.id)}
                >
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-6 shrink-0">
                      {expandedRows[service.id] ? (
                        <ChevronDown className="size-4 transition-transform" />
                      ) : (
                        <ChevronRight className="size-4 transition-transform" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-semibold">{service.name}</TableCell>
                  <TableCell className="text-muted-foreground">{service.type}</TableCell>
                  <TableCell className="font-mono text-xs">{service.version}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        service.risk === "Low"
                          ? "default"
                          : service.risk === "Medium"
                          ? "secondary"
                          : "destructive"
                      }
                      className={service.risk === "Medium" ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : ""}
                    >
                      {service.risk}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <Badge variant="outline" className="px-2 py-0.5 pointer-events-none">
                      {service.assets.length}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* Expandable Content Row */}
                {expandedRows[service.id] && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={6} className="p-0 border-b-0">
                      <div className="p-4 pl-14">
                        <div className="rounded-md border bg-background overflow-hidden shadow-sm">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                              <tr>
                                <th className="px-4 py-2 font-medium text-left">Asset ID</th>
                                <th className="px-4 py-2 font-medium text-left">Internal IP</th>
                                <th className="px-4 py-2 font-medium text-left w-full">Asset Name</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {service.assets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <Link href={`/assets/${asset.id}`} className="font-mono text-xs text-primary hover:underline font-medium flex items-center gap-2">
                                      <Server className="size-3" />
                                      {asset.id}
                                    </Link>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{asset.ip}</td>
                                  <td className="px-4 py-3 font-medium">{asset.name}</td>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
