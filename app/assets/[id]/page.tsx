import Link from "next/link"
import { ChevronLeft, Globe, Activity, ShieldCheck, Cpu, HardDrive, TerminalSquare, AlertTriangle, ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In a real app, you would fetch data for this specific ID.
  const { id } = await params;
  
  // Mock data for the demonstration
  const isAPI = id === "AST-002" || id === "AST-003";

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-8">
      {/* Header section */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full">
            <Link href="/assets">
              <ChevronLeft className="size-5" />
              <span className="sr-only">Back to Assets</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {isAPI ? "Web API Gateway" : "Primary Database Server"}
              </h1>
              <Badge variant="default" className="h-6 uppercase px-2 text-[10px] tracking-wider">Active</Badge>
            </div>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              {id} &bull; {isAPI ? "API/Gateway" : "Database"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Activity className="mr-2 size-4" />
            Run Scan
          </Button>
          <Button size="sm">
            <TerminalSquare className="mr-2 size-4" />
            Connect
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details Panel */}
        <div className="col-span-1 border rounded-xl bg-card text-card-foreground shadow-sm md:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Environment Configuration
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hostname / Domain</span>
              <p className="text-sm font-medium">{isAPI ? "api.gateway.prod.com" : "db01.cluster.internal"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP Address (Public/Private)</span>
              <p className="text-sm font-mono font-medium">10.42.1.205 / 192.168.1.10</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datacenter / Region</span>
              <p className="text-sm font-medium">us-east-1 (AWS)</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operating System</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <Cpu className="size-4" /> Ubuntu 22.04 LTS
              </p>
            </div>
          </div>
        </div>

        {/* Security Posture Summary */}
        <div className="col-span-1 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col">
          <div className="p-6 border-b bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-500" />
              Security Posture
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-sm font-bold text-emerald-500">92/100</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[92%] rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 text-center bg-muted/10">
                <p className="text-muted-foreground text-xs font-bold mb-1 uppercase tracking-wider">Vulnerabilities</p>
                <div className="flex justify-center items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-500" />
                  <span className="text-xl font-semibold">2</span>
                </div>
              </div>
              <div className="border rounded-lg p-3 text-center bg-muted/10">
                <p className="text-muted-foreground text-xs font-bold mb-1 uppercase tracking-wider">Open Ports</p>
                <div className="flex justify-center items-center gap-2">
                  <HardDrive className="size-5 text-primary" />
                  <span className="text-xl font-semibold">{isAPI ? "2" : "1"}</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full text-xs">
              View Vulnerability Details
            </Button>
          </div>
        </div>

        {/* Exposed Services Table (Mock) */}
        <div className="col-span-1 md:col-span-3 border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Exposed Services & Ports</h2>
          </div>
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/5 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4 font-semibold">Port</th>
                  <th className="px-6 py-4 font-semibold">Protocol</th>
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-6 py-4 font-semibold">State</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isAPI ? (
                  <>
                    <tr className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4 font-mono">443</td>
                      <td className="px-6 py-4">TCP</td>
                      <td className="px-6 py-4 font-medium text-primary">HTTPS</td>
                      <td className="px-6 py-4"><Badge variant="default" className="text-[10px]">Open</Badge></td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="size-8"><ArrowUpRight className="size-4" /></Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4 font-mono">80</td>
                      <td className="px-6 py-4">TCP</td>
                      <td className="px-6 py-4 font-medium">HTTP</td>
                      <td className="px-6 py-4"><Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Vulnerable</Badge></td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="size-8"><ArrowUpRight className="size-4" /></Button>
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4 font-mono">5432</td>
                    <td className="px-6 py-4">TCP</td>
                    <td className="px-6 py-4 font-medium text-primary">PostgreSQL</td>
                    <td className="px-6 py-4"><Badge variant="default" className="text-[10px]">Active</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="size-8"><ArrowUpRight className="size-4" /></Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
