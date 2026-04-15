"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Search, Plus, Activity, Play, Pause, Server, Globe, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useGlobalData } from "@/app/context/GlobalDataContext"

export default function TargetsPage() {
  const router = useRouter()
  const { data, refreshData } = useGlobalData()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

  React.useEffect(() => {
    document.title = "Monitored Targets | Qshield Dashboard";
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this target? All associated scan data will be permanently deleted.")) {
      return;
    }

    setIsDeleting(id);
    try {
      const resp = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        await refreshData();
      } else {
        alert("Failed to delete target.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredTargets = React.useMemo(() => {
    return data.targets.filter(
      (t) => {
        const nameMatch = (t.organizationName || t.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const domainMatch = (t.primaryDomain || t.ipRange || "").toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || domainMatch;
      }
    )
  }, [data.targets, searchQuery])

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitored Targets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your initial target scopes, configure scanning automation, and track onboarding status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search targets..."
              className="w-full bg-background pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2 shrink-0" asChild>
            <Link href="/targets/new">
              <Plus className="size-4" /> Onboard Target
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Organization Details</TableHead>
              <TableHead>Scope Context</TableHead>
              <TableHead>Engine Status</TableHead>
              <TableHead className="text-center">Assets Mapped</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTargets.map((target, index) => {
              // Calculate real counts from global data based on Agent scans
              const targetId = String(target._id || target.id || `temp-${index}`);
              const realAssetsCount = data.assets.filter(a => String(a.targetId) === targetId).length;

              return (
                <TableRow
                  key={targetId}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/targets/${targetId}`)}
                >
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Building2 className="size-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{target.organizationName || target.name}</span>
                        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Globe className="size-3" /> {target.primaryDomain || target.domain || target.ipRange}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{target.industry || target.riskLevel || 'Unknown'}</span>
                      <Badge variant="outline" className="w-fit text-[10px]">
                        +{target.domainsCount || 0} Subdomains
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {target.status === "Scanning" && <Activity className="size-4 text-amber-500 animate-pulse" />}
                      {(target.status === "Idle" || target.status === "Active") && <Server className="size-4 text-emerald-500" />}
                      {target.status === "Paused" && <Pause className="size-4 text-muted-foreground" />}

                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${target.status === 'Scanning' ? 'text-amber-500' :
                            (target.status === 'Idle' || target.status === 'Active') ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}>
                          {target.status || 'Active'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Ran {target.lastCompleted || 'Recently'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center bg-muted px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                      {realAssetsCount > 0 ? realAssetsCount : (target.assets || 0)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Toggle Scan Engine"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {target.status === "Paused" ? <Play className="size-4 text-emerald-500" /> : <Pause className="size-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting === targetId}
                        title="Delete Target"
                        onClick={(e) => handleDelete(e, targetId)}
                      >
                        <Trash2 className={`size-4 ${isDeleting === targetId ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
