// centralized mock data for cyb-ui

export const assets = [
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

export const servicesData = [
  {
    id: "SRV-HTTP",
    name: "HTTP / Web Server",
    type: "HTTP",
    version: "Nginx 1.18.0",
    riskScore: 68,
    lastSeen: "2 mins ago",
    trendData: [40, 50, 45, 60, 50, 68, 68],
    assets: [
      { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205", assetRisk: 82 },
      { id: "AST-004", name: "Customer Portal Frontend", ip: "10.42.1.210", assetRisk: 54 },
    ],
  },
  {
    id: "SRV-SSH",
    name: "Secure Shell",
    type: "SSH",
    version: "OpenSSH 8.9p1",
    riskScore: 24,
    lastSeen: "14 mins ago",
    trendData: [20, 22, 24, 24, 24, 24, 24],
    assets: [
      { id: "AST-001", name: "Primary Database Server", ip: "192.168.1.10", assetRisk: 14 },
      { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205", assetRisk: 30 },
      { id: "AST-005", name: "Data Lake Storage", ip: "192.168.2.55", assetRisk: 28 },
    ],
  },
  {
    id: "SRV-PSQL",
    name: "PostgreSQL Database",
    type: "Database",
    version: "PostgreSQL 14.5",
    riskScore: 12,
    lastSeen: "Just now",
    trendData: [15, 12, 12, 12, 10, 12, 12],
    assets: [
      { id: "AST-001", name: "Primary Database Server", ip: "192.168.1.10", assetRisk: 12 },
    ],
  },
  {
    id: "SRV-REDIS",
    name: "Redis KV Store",
    type: "Cache",
    version: "Redis 6.2.6",
    riskScore: 89,
    lastSeen: "4 hours ago",
    trendData: [50, 70, 75, 80, 85, 89, 89],
    assets: [
      { id: "AST-003", name: "Legacy Auth Service", ip: "192.168.1.50", assetRisk: 89 },
    ],
  },
]

export const portsData = [
  {
    id: "PRT-443",
    portNumber: 443,
    protocol: "TCP",
    description: "HTTPS securely encrypts web traffic.",
    severity: 10,
    assets: [
      { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205", lastDetected: "2 mins ago" },
      { id: "AST-004", name: "Customer Portal Frontend", ip: "10.42.1.210", lastDetected: "45 mins ago" },
    ],
  },
  {
    id: "PRT-80",
    portNumber: 80,
    protocol: "TCP",
    description: "Unencrypted web traffic, highly discouraged.",
    severity: 85,
    assets: [
      { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205", lastDetected: "1 hour ago" },
    ],
  },
  {
    id: "PRT-22",
    portNumber: 22,
    protocol: "TCP",
    description: "SSH Remote Login Protocol.",
    severity: 45,
    assets: [
      { id: "AST-001", name: "Primary Database Server", ip: "192.168.1.10", lastDetected: "Just now" },
      { id: "AST-005", name: "Data Lake Storage", ip: "192.168.2.55", lastDetected: "3 hours ago" },
    ],
  },
  {
    id: "PRT-3389",
    portNumber: 3389,
    protocol: "TCP",
    description: "Microsoft Terminal Server (RDP).",
    severity: 95,
    assets: [
      { id: "AST-010", name: "Admin Windows Terminal", ip: "192.168.5.105", lastDetected: "12 mins ago" },
    ],
  },
  {
    id: "PRT-53",
    portNumber: 53,
    protocol: "UDP",
    description: "Domain Name System (DNS) resolution.",
    severity: 20,
    assets: [
      { id: "AST-006", name: "Internal DNS Resolver", ip: "192.168.1.2", lastDetected: "5 mins ago" },
    ],
  },
]

export const initialNodes = [
  // Core Assets
  { id: 'ast-1', type: 'asset', position: { x: 400, y: 100 }, data: { id: "AST-002", name: "Web API Gateway", ip: "10.42.1.205" } },
  { id: 'ast-2', type: 'asset', position: { x: 100, y: 100 }, data: { id: "AST-001", name: "Primary Database Server", ip: "192.168.1.10" } },
  
  // Attached Services - API Gateway
  { id: 'srv-1', type: 'service', position: { x: 300, y: 300 }, data: { label: "HTTPS / API", type: "HTTP", port: 443, risk: 10 } },
  { id: 'srv-2', type: 'service', position: { x: 500, y: 300 }, data: { label: "Legacy HTTP", type: "Unencrypted", port: 80, risk: 85 } },

  // Attached Services - DB Server
  { id: 'srv-3', type: 'service', position: { x: 100, y: 300 }, data: { label: "PostgreSQL", type: "Database", port: 5432, risk: 12 } },
  { id: 'srv-4', type: 'service', position: { x: 250, y: 250 }, data: { label: "Secure Shell", type: "SSH", port: 22, risk: 24 } },
]

export const initialEdges = [
  { id: 'e-ast1-srv1', source: 'ast-1', target: 'srv-1', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }, // Secure connection
  { id: 'e-ast1-srv2', source: 'ast-1', target: 'srv-2', animated: true, style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '5,5' } }, // Risky
  { id: 'e-ast2-srv3', source: 'ast-2', target: 'srv-3', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e-ast2-srv4', source: 'ast-2', target: 'srv-4', animated: true },
  { id: 'e-ast1-srv4', source: 'ast-1', target: 'srv-4', animated: true }, // Shared SSH connection
]
