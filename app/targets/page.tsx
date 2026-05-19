"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, Search, Activity, Play, Pause, Server, Globe, Trash2, RefreshCw } from "lucide-react"
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

async function fetchAndSyncTargets() {
  const resp = await fetch('/api/targets/scan', { method: 'POST' });
  if (!resp.ok) throw new Error('Failed to scan network');
  return resp.json();
}
export default function TargetsPage() {
  const router = useRouter()
  const { data, refreshData } = useGlobalData()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null)
  const [isSyncing, setIsSyncing] = React.useState(false)

  React.useEffect(() => {
    document.title = "Monitored Targets | INIDS Dashboard";
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
        const ipMatch = (t.ip || "").toLowerCase().includes(searchQuery.toLowerCase());
        const macMatch = (t.mac || "").toLowerCase().includes(searchQuery.toLowerCase());
        return ipMatch || macMatch;
      }
    )
  }, [data.targets, searchQuery])

  // Frame devices list for topology
  const devices = data.targets.map((t) => ({
    id: t._id || t.id || t.ip,
    ip: t.ip,
    mac: t.mac,
    hostname: t.hostname,
    alive: t.alive,
    latency_ms: t.latency_ms,
    os_guess: t.os_guess,
    device_type: t.device_type,
    open_ports: t.open_ports || [],
    interface: t.interface,
    network: t.network,
    isRouter: t.ip === data.targets.find(d => d.ip && d.ip.endsWith('.1'))?.ip // heuristic: .1 is router
  }));

  // Optionally, expose devices for topology via context or localStorage if needed

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
              placeholder="Search by IP or MAC..."
              className="w-full bg-background pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2 shrink-0" onClick={async () => {
            setIsSyncing(true);
            try {
              await fetchAndSyncTargets();
              await refreshData();
            } catch (e) {
              alert('Failed to scan and sync targets.');
            } finally {
              setIsSyncing(false);
            }
          }} disabled={isSyncing}>
            <RefreshCw className={isSyncing ? 'animate-spin size-4' : 'size-4'} />
            {isSyncing ? 'Syncing...' : 'Scan Network'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        {/* Devices List for Topology (hidden, but available for topology page) */}
        <div style={{ display: 'none' }} id="devices-for-topology">
          {JSON.stringify(devices)}
        </div>
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
              const targetId = String(target._id || target.id || `temp-${index}`);
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
                        <span className="font-semibold">{target.ip}</span>
                        {target.device_type && <span className="text-xs text-muted-foreground font-mono">{target.device_type}</span>}
                        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Globe className="size-3" /> {target.mac}
                        </span>
                        {target.hostname && <span className="text-xs text-muted-foreground font-mono">{target.hostname}</span>}
                        {target.os_guess && <span className="text-xs text-muted-foreground font-mono">OS: {target.os_guess}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{target.interface || ''}</span>
                      <Badge variant="outline" className="w-fit text-[10px]">
                        {target.network || ''}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {target.alive ? <Server className="size-4 text-emerald-500" /> : <Pause className="size-4 text-muted-foreground" />}
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${target.alive ? 'text-emerald-500' : 'text-muted-foreground'}`}>{target.alive ? 'Alive' : 'Offline'}</span>
                        <span className="text-[10px] text-muted-foreground">{target.latency_ms ? `${target.latency_ms} ms` : ''}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center bg-muted px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                      {target.scan_time_seconds ? `${target.scan_time_seconds}s` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
