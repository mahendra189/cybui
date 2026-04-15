"use client"

import * as React from "react"
import { Bell, Copy, KeyRound, Monitor, Moon, Save, ShieldAlert, Sun, Activity, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SettingsPage() {
  const [theme, setTheme] = React.useState("dark")

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure dashboard behaviors, scanning automation, and your organization's risk profile.
          </p>
        </div>
        <Button className="gap-2">
          <Save className="size-4" /> Save Preferences
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="scanning">Scanning</TabsTrigger>
          <TabsTrigger value="risk">Risk Thresholds</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the Qshield UI looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="w-32 justify-start gap-2"
                >
                  <Sun className="size-4" /> Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="w-32 justify-start gap-2"
                >
                  <Moon className="size-4" /> Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="w-32 justify-start gap-2"
                >
                  <Monitor className="size-4" /> System
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how we contact you about critical incidents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">Critical Vulnerability Alerts</div>
                  <p className="text-xs text-muted-foreground">Receive instant emails when an asset hits Critical risk.</p>
                </div>
                <div className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-primary outline-hidden ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="pointer-events-none block h-4 w-4 translate-x-4 rounded-full bg-background shadow-lg ring-0 transition-transform" />
                </div>
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">Weekly Summary Reports</div>
                  <p className="text-xs text-muted-foreground">Get a roll-up of newly discovered open ports and services.</p>
                </div>
                <div className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted outline-hidden ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-background shadow-lg ring-0 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scanning Settings */}
        <TabsContent value="scanning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Intervals</CardTitle>
              <CardDescription>
                Define how frequently the engine crawls your mapped assets and domains.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Global Rescan Frequency</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>Continuous / Real-Time (High Compute)</option>
                  <option selected>Every 4 Hours</option>
                  <option>Every 12 Hours</option>
                  <option>Daily at Midnight</option>
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="size-4 text-primary" /> Active Module Targets</h3>

                <div className="flex items-center space-x-3 border rounded-md p-3">
                  <input type="checkbox" className="h-4 w-4 bg-background border-primary" defaultChecked />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Deep Port Scanning (Nmap)</span>
                    <span className="text-xs text-muted-foreground">Crawls all 65,535 TCP/UDP ports on standard execution.</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 border rounded-md p-3">
                  <input type="checkbox" className="h-4 w-4 bg-background border-primary" defaultChecked />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">CVE Signature Matching</span>
                    <span className="text-xs text-muted-foreground">Cross-references discovered software versions with NVD.</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Thresholds */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Aggregation Multipliers</CardTitle>
              <CardDescription>
                Fine-tune how severity scores are calculated on final asset reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                  <span className="flex items-center gap-2"><ShieldAlert className="size-4 text-destructive" /> Critical Threshold Boundary</span>
                  <span className="tabular-nums font-mono">75</span>
                </div>
                <input type="range" min="0" max="100" defaultValue="75" className="w-full accent-destructive w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                <p className="text-[10px] text-muted-foreground">
                  Scores equal to or exceeding this line denote critical infrastructure peril.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                  <span className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-500" /> Elevated/Warning Boundary</span>
                  <span className="tabular-nums font-mono">40</span>
                </div>
                <input type="range" min="0" max="100" defaultValue="40" className="w-full accent-amber-500 w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                <p className="text-[10px] text-muted-foreground">
                  Scores bridging this line up to Critical will display as Warnings.
                </p>
              </div>

            </CardContent>
            <CardFooter className="bg-muted/30 border-t py-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Changing thresholds will re-calculate aggregate mapping across the Topology engine.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>API Access Keys</CardTitle>
                <CardDescription>
                  Keys for programmatic access to the ingestion endpoints and SOC streams.
                </CardDescription>
              </div>
              <Button size="sm" className="gap-2 shrink-0">
                <KeyRound className="size-4" /> Generate New Key
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Key Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/20">
                      <TableCell className="font-semibold">GitHub Actions CI Pipeline</TableCell>
                      <TableCell className="font-mono text-xs">cyb_sec_w8A...</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">Read & Write</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">11 days ago</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Copy className="size-4 text-muted-foreground" /></Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/20">
                      <TableCell className="font-semibold">External SOC Stream</TableCell>
                      <TableCell className="font-mono text-xs">cyb_sec_0q1...</TableCell>
                      <TableCell><Badge variant="outline" className="bg-muted text-[10px]">Read-Only</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">2 months ago</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Copy className="size-4 text-muted-foreground" /></Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
