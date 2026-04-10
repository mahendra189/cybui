import Link from "next/link"
import { ChevronLeft, Globe, Activity, ShieldCheck, Cpu, HardDrive, TerminalSquare, AlertTriangle, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="network">Network Config</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Score
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">92/100</div>
                <Progress value={92} className="h-2 mt-3 [&>div]:bg-emerald-500" />
                <p className="text-xs text-muted-foreground mt-2">
                  +2% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vulnerabilities
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 Issues</div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="destructive" className="px-1 text-[10px]">1 HIGH</Badge>
                  <Badge variant="secondary" className="px-1 text-[10px] text-amber-500">1 MEDIUM</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Uptime
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.98%</div>
                <Progress value={99.98} className="h-2 mt-3" />
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-500" /> Operational
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Environment Details</CardTitle>
                <CardDescription>
                  Hardware and deployment configuration for this asset.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hostname</span>
                  <p className="font-semibold">{isAPI ? "api.gateway.prod.com" : "db01.cluster.internal"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Datacenter</span>
                  <p className="font-semibold flex items-center gap-2">
                    <Globe className="size-4 text-primary" /> us-east-1 (AWS)
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal IP</span>
                  <p className="font-mono text-sm font-medium">192.168.1.10</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System</span>
                  <p className="font-medium flex items-center gap-2">
                    <Cpu className="size-4 text-muted-foreground" /> Ubuntu 22.04 LTS
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Scan Activity</CardTitle>
                <CardDescription>
                  Automated security posture checks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-2 rounded-full ring-4 ring-emerald-500/20 bg-emerald-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Complete System Scan</p>
                      <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-2 rounded-full ring-4 ring-amber-500/20 bg-amber-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Network Discovery</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 4:15 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-2 rounded-full ring-4 ring-red-500/20 bg-red-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Vulnerability Patch Check</p>
                      <p className="text-xs text-muted-foreground">Oct 29, 2023</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identified Vulnerabilities</CardTitle>
              <CardDescription>
                Detailed list of security issues found during the last scan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border divide-y">
                <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1"><XCircle className="size-5 text-destructive" /></div>
                    <div>
                      <h4 className="font-semibold text-sm">CVE-2023-4863: WebP Heap Buffer Overflow</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Buffer overflow via malformed WebP image can lead to arbitrary code execution.</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="destructive" className="h-5 text-[10px]">Critical</Badge>
                        <span className="text-xs text-muted-foreground">CVSS: 8.8</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Review</Button>
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1"><AlertTriangle className="size-5 text-amber-500" /></div>
                    <div>
                      <h4 className="font-semibold text-sm">Outdated Nginx Version</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Server is running Nginx 1.18.0 which contains known medium severity vulnerabilities.</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="h-5 text-[10px] text-amber-500 border-amber-500/20 bg-amber-500/10">Medium</Badge>
                        <span className="text-xs text-muted-foreground">CVSS: 5.3</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Review</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exposed Services & Ports</CardTitle>
              <CardDescription>
                Active network exposure based on nmap scans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Port</th>
                      <th className="px-6 py-3 font-semibold">Protocol</th>
                      <th className="px-6 py-3 font-semibold">Service</th>
                      <th className="px-6 py-3 font-semibold">State</th>
                      <th className="px-6 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isAPI ? (
                      <>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-mono">443</td>
                          <td className="px-6 py-4">TCP</td>
                          <td className="px-6 py-4 font-medium text-primary">HTTPS</td>
                          <td className="px-6 py-4"><Badge variant="default" className="text-[10px]">Open</Badge></td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" className="size-8"><ArrowUpRight className="size-4" /></Button>
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-mono">80</td>
                          <td className="px-6 py-4">TCP</td>
                          <td className="px-6 py-4 font-medium">HTTP</td>
                          <td className="px-6 py-4"><Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">Vulnerable</Badge></td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" className="size-8"><ArrowUpRight className="size-4" /></Button>
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr className="hover:bg-muted/50 transition-colors">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
