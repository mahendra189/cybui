import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRight } from "lucide-react"

const assets = [
  {
    id: "AST-001",
    name: "Primary Database Server",
    type: "Server",
    status: "Active",
    lastScanned: "2023-11-20 10:30 AM",
  },
  {
    id: "AST-002",
    name: "Web API Gateway",
    type: "Gateway",
    status: "Active",
    lastScanned: "2023-11-20 09:15 AM",
  },
  {
    id: "AST-003",
    name: "Legacy Auth Service",
    type: "Microservice",
    status: "Inactive",
    lastScanned: "2023-11-15 14:00 PM",
  },
  {
    id: "AST-004",
    name: "Customer Portal Frontend",
    type: "Web Server",
    status: "Active",
    lastScanned: "2023-11-20 11:45 AM",
  },
  {
    id: "AST-005",
    name: "Data Lake Storage",
    type: "Storage",
    status: "Warning",
    lastScanned: "2023-11-19 16:20 PM",
  },
]

export default function AssetsPage() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground">
          Manage and review scan statuses for all tracked infrastructure.
        </p>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Asset ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last Scanned</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id} className="group hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium font-mono text-xs">{asset.id}</TableCell>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell className="text-muted-foreground">{asset.type}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      asset.status === "Active"
                        ? "default"
                        : asset.status === "Inactive"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {asset.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {asset.lastScanned}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/assets/${asset.id}`}>
                      <ArrowRight className="size-4" />
                      <span className="sr-only">View Details</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
