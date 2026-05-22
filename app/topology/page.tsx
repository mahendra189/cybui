"use client"

import React from "react"
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
import "@xyflow/react/dist/base.css"
import Link from "next/link"
import { Wifi, Globe, Activity, ScanLine, ArrowUp, ArrowDown, ActivitySquare, Network } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGlobalData } from "@/app/context/GlobalDataContext"
import { getRadialLayout, getHierarchicalLayout, getGridLayout } from "@/lib/topology-layouts"

/* --- Custom Node Types --- */

// Router/Gateway Node - placed in center
const RouterNode = ({ data }: { data: any }) => {
  const isMalicious = data.isMalicious;
  const containerBorder = isMalicious 
    ? "border-red-500 animate-threat-glow shadow-lg shadow-red-500/20" 
    : "border-amber-500/80 shadow-amber-500/30";
  const containerBg = isMalicious
    ? "bg-linear-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900/60"
    : "bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900";
  const iconColor = isMalicious ? "text-red-500 animate-pulse" : "text-amber-600";
  const ipColor = isMalicious ? "text-red-600 font-bold" : "text-amber-700";

  return (
    <div className={`relative rounded-full border-4 ${containerBorder} ${containerBg} p-4 w-24 h-24 shadow-lg flex items-center justify-center`}>
      <Handle type="source" position={Position.Bottom} className={isMalicious ? "bg-red-500!" : "bg-amber-500!"} />
      <Handle type="source" position={Position.Top} className={isMalicious ? "bg-red-500!" : "bg-amber-500!"} />
      <Handle type="source" position={Position.Left} className={isMalicious ? "bg-red-500!" : "bg-amber-500!"} />
      <Handle type="source" position={Position.Right} className={isMalicious ? "bg-red-500!" : "bg-amber-500!"} />
      
      <div className="flex flex-col items-center gap-1">
        <Wifi className={`size-6 ${iconColor}`} />
        <div className="text-center">
          <h3 className="text-xs font-bold font-mono truncate max-w-[80px]">{data.id}</h3>
          <p className={`text-[9px] ${ipColor} font-mono`}>{data.ip}</p>
        </div>
      </div>
      {isMalicious && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 border-2 border-background shadow animate-bounce text-[9px] font-bold text-white">
          ☠️
        </span>
      )}
    </div>
  )
}

// Device Node - connected to router
const DeviceNode = ({ data }: { data: any }) => {
  const isAlive = data.alive;
  const isMalicious = data.isMalicious;
  
  const borderClass = isMalicious
    ? "border-red-500 animate-threat-glow shadow-md shadow-red-500/10"
    : isAlive 
      ? "border-emerald-500/60" 
      : "border-gray-500/60";
      
  const bgClass = isMalicious
    ? "bg-red-50 dark:bg-red-950/40"
    : isAlive 
      ? "bg-emerald-50 dark:bg-emerald-950" 
      : "bg-gray-50 dark:bg-gray-950";
      
  const iconBgClass = isMalicious
    ? "bg-red-500/10 text-red-500 animate-pulse"
    : isAlive 
      ? "bg-emerald-500/10 text-emerald-600" 
      : "bg-gray-500/10 text-gray-600";
      
  const handleColor = isMalicious
    ? "!bg-red-500"
    : isAlive 
      ? "!bg-emerald-500" 
      : "!bg-gray-500";
  
  return (
    <div className={`relative rounded-lg border-2 ${borderClass} ${bgClass} p-3 w-40 shadow-md`}>
      <Handle type="target" position={Position.Top} className={handleColor} />
      <Handle type="source" position={Position.Bottom} className={handleColor} />
      
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded ${iconBgClass}`}>
          <Globe className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-xs font-bold font-mono truncate">{data.hostname || data.id}</h3>
            {isMalicious && (
              <span className="text-[10px] animate-pulse" title="MALICIOUS THREAT DETECTED">⚠️</span>
            )}
          </div>
          <p className={`text-[9px] truncate ${isMalicious ? "text-red-500 font-bold" : "text-muted-foreground"}`}>{data.ip}</p>
          {data.os_guess && <p className="text-[8px] text-muted-foreground truncate">{data.os_guess}</p>}
        </div>
      </div>
      
      {data.open_ports && data.open_ports.length > 0 && (
        <div className="mt-2 text-[8px] text-muted-foreground">
          <span className="font-semibold">Ports:</span> {data.open_ports.slice(0, 3).join(", ")}{data.open_ports.length > 3 ? "..." : ""}
        </div>
      )}
      
      <div className="mt-2 flex gap-1">
        <Button variant={isMalicious ? "destructive" : "secondary"} size="sm" className="h-5 text-[9px] flex-1" asChild>
          <Link href={`/assets/${data.realId}`}>
            {isMalicious ? "Investigate Threat" : "View"}
          </Link>
        </Button>
      </div>
    </div>
  )
}

const nodeTypes = {
  router: RouterNode,
  device: DeviceNode,
}

export default function TopologyPage() {
  const { data: dbData } = useGlobalData()
  const [selectedNetwork, setSelectedNetwork] = React.useState("all")
  const [layoutMode, setLayoutMode] = React.useState<"radial" | "hierarchical" | "grid">("radial")
  const [packetFeed, setPacketFeed] = React.useState<any[]>([])
  const [totalPacketsCount, setTotalPacketsCount] = React.useState(0)
  const [movingPacket, setMovingPacket] = React.useState<any | null>(null)
  const [motionProgress, setMotionProgress] = React.useState(0)
  const [connectionStatus, setConnectionStatus] = React.useState<"connecting" | "connected" | "disconnected">("disconnected")
  const bubblePositionsRef = React.useRef(new Map<string, { x: number; y: number }>());
  const packetBufferRef = React.useRef<any[]>([]);
  const motionFrameRef = React.useRef<number | null>(null)
  const motionTimeoutRef = React.useRef<number | null>(null)

  // AI Threat State
  const [maliciousIps, setMaliciousIps] = React.useState<Set<string>>(new Set())
  const [blockedIps, setBlockedIps] = React.useState<Set<string>>(new Set())
  const [alerts, setAlerts] = React.useState<any[]>([])
  const [toasts, setToasts] = React.useState<any[]>([])
  const [autoScan, setAutoScan] = React.useState(true)
  const [isScanning, setIsScanning] = React.useState(false)
  const [analyzingPackets, setAnalyzingPackets] = React.useState<Set<string>>(new Set())
  const [packetAssessments, setPacketAssessments] = React.useState<Record<string, { status: 'pending' | 'benign' | 'malicious', reason?: string, severity?: string }>>({})

  const blockedIpsRef = React.useRef(blockedIps)
  React.useEffect(() => {
    blockedIpsRef.current = blockedIps
  }, [blockedIps])

  const autoScanRef = React.useRef(autoScan)
  React.useEffect(() => {
    autoScanRef.current = autoScan
  }, [autoScan])

  const isAnalyzingRef = React.useRef(false)
  const lastScanTimeRef = React.useRef(0)

  const networkDevices = React.useMemo(() => {
    let devices = dbData.targets || []

    if (selectedNetwork !== "all") {
      devices = devices.filter(d => d.network === selectedNetwork || d.interface === selectedNetwork)
    }

    return devices
  }, [dbData.targets, selectedNetwork])

  const { globalNodes, globalEdges, routerDevice } = React.useMemo(() => {
    const devices = networkDevices

    if (devices.length === 0) {
      console.warn("[Topology] No devices found!");
      return { globalNodes: [], globalEdges: [], routerDevice: null };
    }

    const routerDevice = devices.find(d => d.ip && d.ip.endsWith('.1')) || 
                         devices.find(d => d.device_type?.toLowerCase().includes('router') || d.device_type?.toLowerCase().includes('gateway')) ||
                         devices.find(d => d.device_type?.toLowerCase().includes('access point')) ||
                         devices[0];

    if (!routerDevice) {
      console.error("[Topology] No router device found!");
      return { globalNodes: [], globalEdges: [] };
    }

    const routerNode: Node = {
      id: `router-${routerDevice.ip}`,
      type: "router",
      position: { x: 0, y: 0 },
      data: {
        id: routerDevice.hostname || routerDevice.ip,
        ip: routerDevice.ip,
        mac: routerDevice.mac,
        device_type: routerDevice.device_type,
        realId: routerDevice._id || routerDevice.ip,
      },
    };

    const otherDevices = devices.filter(d => d.ip !== routerDevice.ip);

    let layoutResult;
    switch (layoutMode) {
      case "hierarchical":
        layoutResult = getHierarchicalLayout(otherDevices, routerNode);
        break;
      case "grid":
        layoutResult = getGridLayout(otherDevices, routerNode);
        break;
      case "radial":
      default:
        layoutResult = getRadialLayout(otherDevices, routerNode);
        break;
    }

    return { globalNodes: layoutResult.nodes, globalEdges: layoutResult.edges, routerDevice };
  }, [networkDevices, layoutMode]);

  const mainPacketDevice = React.useMemo(() => routerDevice || networkDevices[0] || null, [routerDevice, networkDevices])

  const addToast = React.useCallback((title: string, message: string, severity: string, packet: any) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast = { id, title, message, severity, packet };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  const isSuspiciousPacket = React.useCallback((pkt: any) => {
    if (!pkt.info) return false;
    const lowerInfo = pkt.info.toLowerCase();
    
    const patterns = [
      'php', 'cgi-bin', 'select', 'union', 'drop', 'insert', 'script', 'xml',
      'cmd', 'exec', 'etc/passwd', 'win.ini', 'suhosin', 'allow_url', 'eval',
      'base64', 'passwd', 'etc', 'boot.ini', '..%2f', '..%5c', '../', '..\\',
      'nmap', 'sqlmap', 'nikto', 'hydra', 'metasploit', 'exploit', 'wp-admin'
    ];
    
    const hasPattern = patterns.some(pattern => lowerInfo.includes(pattern));
    const isScan = pkt.state === 'syn' || pkt.state === 'reset';
    
    const highRiskPorts = ['4444', '1337', '31337', '8080', '22', '23', '21'];
    const hasHighRiskPort = pkt.source.includes(':') && highRiskPorts.some(port => pkt.source.includes(`:${port}`) || pkt.destination.includes(`:${port}`));
    
    return hasPattern || isScan || hasHighRiskPort;
  }, []);

  const analyzePacket = React.useCallback(async (packet: any) => {
    if (analyzingPackets.has(packet.id)) return;
    
    setAnalyzingPackets(prev => {
      const next = new Set(prev);
      next.add(packet.id);
      return next;
    });

    setIsScanning(true);
    isAnalyzingRef.current = true;
    setPacketAssessments(prev => ({ ...prev, [packet.id]: { status: 'pending' } }));

    try {
      const response = await fetch('/api/packets/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: packet.time,
          protocol: packet.protocol,
          source: packet.source,
          destination: packet.destination,
          length: packet.size,
          info: packet.info
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis server returned status ${response.status}`);
      }

      const assessment = await response.json();

      if (assessment.malicious) {
        setPacketAssessments(prev => ({ 
          ...prev, 
          [packet.id]: { 
            status: 'malicious', 
            reason: assessment.reason, 
            severity: assessment.severity 
          } 
        }));

        const extractIp = (addressStr: string) => {
          const match = addressStr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          return match ? match[1] : addressStr;
        };

        const srcIp = extractIp(packet.source);
        const destIp = extractIp(packet.destination);
        
        setMaliciousIps(prev => {
          const next = new Set(prev);
          if (srcIp) next.add(srcIp);
          if (destIp) next.add(destIp);
          return next;
        });

        const alertId = `${Date.now()}-${Math.random()}`;
        const newAlert = {
          id: alertId,
          time: packet.time,
          packetId: packet.id,
          source: packet.source,
          destination: packet.destination,
          protocol: packet.protocol,
          severity: assessment.severity || 'high',
          reason: assessment.reason,
          info: packet.info,
          srcIp,
          destIp
        };

        setAlerts(prev => [newAlert, ...prev]);

        addToast(
          `☠️ AI THREAT ALERT: ${assessment.severity.toUpperCase()}`,
          assessment.reason,
          assessment.severity,
          packet
        );
      } else {
        setPacketAssessments(prev => ({ 
          ...prev, 
          [packet.id]: { 
            status: 'benign', 
            reason: assessment.reason 
          } 
        }));
      }
    } catch (err) {
      console.error("[AI Threat Guard] Error analyzing packet:", err);
      setPacketAssessments(prev => {
        const next = { ...prev };
        delete next[packet.id];
        return next;
      });
    } finally {
      setIsScanning(false);
      isAnalyzingRef.current = false;
      lastScanTimeRef.current = Date.now();
    }
  }, [analyzingPackets, addToast]);

  const injectSimulatedThreat = React.useCallback(() => {
    const mockMaliciousPackets = [
      {
        id: `simulated-${Date.now()}-1`,
        time: new Date().toLocaleTimeString(),
        protocol: 'HTTP',
        direction: 'in' as const,
        hubLabel: mainPacketDevice?.hostname || mainPacketDevice?.ip || 'Hub',
        hubAddress: mainPacketDevice?.ip || '127.0.0.1',
        peerKey: '192.168.1.137',
        peerLabel: 'External Attacker (192.168.1.137)',
        peerAddress: '192.168.1.137',
        source: `External Attacker (192.168.1.137:49210)`,
        destination: `${mainPacketDevice?.hostname || 'Hub'} (${mainPacketDevice?.ip || '127.0.0.1'}:80)`,
        size: 336,
        state: 'push-data',
        info: 'GET /cgi-bin/php?%-d+allow_url_include%3don+-d+safe_mode%3doff+-d+suhosin.simulation%3don+-d+disable_functions%3d%22%22+-d+open_basedir%3dnone+-d+auto_prepend_file%3dphp://input+-n HTTP/1.1',
      },
      {
        id: `simulated-${Date.now()}-2`,
        time: new Date().toLocaleTimeString(),
        protocol: 'TCP',
        direction: 'in' as const,
        hubLabel: mainPacketDevice?.hostname || mainPacketDevice?.ip || 'Hub',
        hubAddress: mainPacketDevice?.ip || '127.0.0.1',
        peerKey: '10.0.0.99',
        peerLabel: 'Recon Scanner (10.0.0.99)',
        peerAddress: '10.0.0.99',
        source: `Recon Scanner (10.0.0.99:31337)`,
        destination: `${mainPacketDevice?.hostname || 'Hub'} (${mainPacketDevice?.ip || '127.0.0.1'}:4444)`,
        size: 64,
        state: 'syn',
        info: 'SYN SCAN - Flags [S], seq 4294967295, win 1024, option [mss 1460]',
      }
    ];

    const pkt = mockMaliciousPackets[Math.floor(Math.random() * mockMaliciousPackets.length)];
    
    if (blockedIps.has(pkt.peerAddress)) {
      alert(`Simulation blocked: Traffic from ${pkt.peerAddress} is blacklisted on the firewall.`);
      return;
    }

    setPacketFeed(prev => [pkt, ...prev].slice(0, 100));
    setMovingPacket(pkt);

    if (autoScan) {
      setTimeout(() => {
        analyzePacket(pkt);
      }, 300);
    }
  }, [mainPacketDevice, autoScan, analyzePacket, blockedIps]);


  const createBubblePosition = React.useCallback(() => {
    const angle = Math.random() * Math.PI * 2
    const radius = 18 + Math.random() * 28
    const x = Math.min(88, Math.max(12, 50 + Math.cos(angle) * radius))
    const y = Math.min(88, Math.max(12, 50 + Math.sin(angle) * radius))
    return { x, y }
  }, [])

  const getBubblePosition = React.useCallback((peerKey: string) => {
    const existing = bubblePositionsRef.current.get(peerKey)
    if (existing) return existing

    const position = createBubblePosition()
    bubblePositionsRef.current.set(peerKey, position)
    return position
  }, [createBubblePosition])

  const uniqueNetworks = React.useMemo(() => {
    const networks = new Set<string>();
    dbData.targets?.forEach(t => {
      if (t.network) networks.add(t.network);
      if (t.interface) networks.add(t.interface);
    });
    return Array.from(networks);
  }, [dbData.targets]);

  const targetNodes = React.useMemo(() => {
    return globalNodes.map(node => {
      const ip = (node.data as any).ip as string | undefined;
      const isMalicious = ip ? maliciousIps.has(ip) : false;
      return {
        ...node,
        data: {
          ...node.data,
          isMalicious
        }
      };
    });
  }, [globalNodes, maliciousIps])

  const targetEdges = React.useMemo(() => {
    const nodeIds = new Set(targetNodes.map(n => n.id))
    return globalEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [targetNodes, globalEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(targetNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(targetEdges)

  const onConnect = React.useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  React.useEffect(() => {
    setNodes(targetNodes)
    setEdges(targetEdges)
  }, [targetNodes, targetEdges, setNodes, setEdges])

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (packetBufferRef.current.length === 0) return;

      const newPackets = [...packetBufferRef.current];
      packetBufferRef.current = [];

      setPacketFeed(prev => {
        const reversed = [...newPackets].reverse();
        const combined = [...reversed, ...prev];
        return combined.slice(0, 50);
      });

      setMovingPacket((prev: any) => {
        if (!prev && newPackets.length > 0) {
          return newPackets[newPackets.length - 1];
        }
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interfaceName = selectedNetwork !== "all" ? selectedNetwork : "lo0";
    const streamUrl = `http://127.0.0.1:8000/api/packets/stream?interface=${interfaceName}`;

    setConnectionStatus("connecting");
    setPacketFeed([]);
    setTotalPacketsCount(0);
    packetBufferRef.current = [];
    
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        
        const parseIpAndPort = (str: string) => {
          if (!str) return { ip: '', port: '' };
          const ipv4WithDotPort = str.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d+)$/);
          if (ipv4WithDotPort) {
            return { ip: ipv4WithDotPort[1], port: ipv4WithDotPort[2] };
          }
          const parts = str.split(':');
          if (parts.length > 1) {
            return { ip: parts.slice(0, -1).join(':'), port: parts[parts.length - 1] };
          }
          return { ip: str, port: '' };
        };

        const srcInfo = parseIpAndPort(rawData.source);
        const destInfo = parseIpAndPort(rawData.destination);

        if (blockedIpsRef.current.has(srcInfo.ip) || blockedIpsRef.current.has(destInfo.ip)) {
          return;
        }

        const hubIp = mainPacketDevice?.ip || '127.0.0.1';
        let direction: 'in' | 'out' = 'in';
        let peerIp = srcInfo.ip;
        let hubAddress = destInfo.ip;

        if (srcInfo.ip === hubIp) {
          direction = 'out';
          peerIp = destInfo.ip;
          hubAddress = srcInfo.ip;
        } else if (destInfo.ip === hubIp) {
          direction = 'in';
          peerIp = srcInfo.ip;
          hubAddress = destInfo.ip;
        } else if (routerDevice && srcInfo.ip === routerDevice.ip) {
          direction = 'out';
          peerIp = destInfo.ip;
          hubAddress = srcInfo.ip;
        } else if (routerDevice && destInfo.ip === routerDevice.ip) {
          direction = 'in';
          peerIp = srcInfo.ip;
          hubAddress = destInfo.ip;
        } else {
          const isInbound = destInfo.ip === '127.0.0.1' || destInfo.ip.startsWith('192.168.') || destInfo.ip.startsWith('10.') || destInfo.ip.startsWith('224.') || destInfo.ip === '255.255.255.255';
          direction = isInbound ? 'in' : 'out';
          peerIp = isInbound ? srcInfo.ip : destInfo.ip;
          hubAddress = isInbound ? destInfo.ip : srcInfo.ip;
        }

        const peerDevice = networkDevices.find(d => d.ip === peerIp);
        const peerLabel = peerDevice?.hostname || peerDevice?.ip || `Device ${peerIp}`;

        const hubDevice = networkDevices.find(d => d.ip === hubAddress);
        const hubLabel = hubDevice?.hostname || hubDevice?.ip || `Hub (${hubAddress})`;

        let displayProtocol = rawData.protocol || 'IP';
        if (srcInfo.port === '53' || destInfo.port === '53') displayProtocol = 'DNS';
        else if (srcInfo.port === '80' || destInfo.port === '80') displayProtocol = 'HTTP';
        else if (srcInfo.port === '443' || destInfo.port === '443') displayProtocol = 'HTTPS';
        else if (rawData.info && (rawData.info.includes('Flags') || rawData.info.includes('seq') || rawData.info.includes('ack'))) displayProtocol = 'TCP';

        let state = 'flowing';
        if (rawData.info) {
          const flagsMatch = rawData.info.match(/Flags \[(.*?)\]/);
          if (flagsMatch) {
            const flags = flagsMatch[1];
            if (flags.includes('S')) state = 'syn';
            else if (flags.includes('P')) state = 'push-data';
            else if (flags.includes('F')) state = 'fin';
            else if (flags.includes('R')) state = 'reset';
            else if (flags === '.') state = 'ack';
          }
        }

        const packet = {
          id: `${Date.now()}-${Math.random()}`,
          time: rawData.timestamp || new Date().toLocaleTimeString(),
          protocol: displayProtocol,
          direction,
          hubLabel,
          hubAddress,
          peerKey: peerIp,
          peerLabel,
          peerAddress: peerIp,
          source: direction === 'out' ? `${hubLabel} (${hubAddress}:${srcInfo.port})` : `${peerLabel} (${peerIp}:${srcInfo.port})`,
          destination: direction === 'out' ? `${peerLabel} (${peerIp}:${destInfo.port})` : `${hubLabel} (${hubAddress}:${destInfo.port})`,
          size: typeof rawData.length === 'number' ? rawData.length : parseInt(rawData.length) || 64,
          state,
          info: rawData.info || rawData.raw || '',
        };

        // Increment total packets count
        setTotalPacketsCount(prev => prev + 1);

        // Buffer the packet
        packetBufferRef.current.push(packet);

        if (autoScanRef.current && !isAnalyzingRef.current) {
          const isSuspicious = isSuspiciousPacket(packet);
          const timeSinceLastScan = Date.now() - lastScanTimeRef.current;
          
          if (isSuspicious || timeSinceLastScan > 20000) {
            setTimeout(() => {
              analyzePacket(packet);
            }, 50);
          }
        }

      } catch (err) {
        console.error("[Packets] Error parsing SSE packet:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[Packets] EventSource error:", err);
      setConnectionStatus("disconnected");
    };

    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");
    };
  }, [selectedNetwork, networkDevices, routerDevice, mainPacketDevice, isSuspiciousPacket, analyzePacket])

  React.useEffect(() => {
    if (!movingPacket) return

    if (motionFrameRef.current !== null) {
      cancelAnimationFrame(motionFrameRef.current)
    }
    if (motionTimeoutRef.current !== null) {
      window.clearTimeout(motionTimeoutRef.current)
    }

    const duration = 520
    const start = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setMotionProgress(progress)

      if (progress < 1) {
        motionFrameRef.current = requestAnimationFrame(animate)
      } else {
        motionTimeoutRef.current = window.setTimeout(() => {
          setMovingPacket(null)
          setMotionProgress(0)
        }, 140)
      }
    }

    motionFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (motionFrameRef.current !== null) {
        cancelAnimationFrame(motionFrameRef.current)
      }
      if (motionTimeoutRef.current !== null) {
        window.clearTimeout(motionTimeoutRef.current)
      }
    }
  }, [movingPacket])

  const packetMapPeers = React.useMemo(() => {
    const peerMap = new Map<string, any>()

    packetFeed.forEach((pkt) => {
      if (!pkt.peerKey) return

      const existing = peerMap.get(pkt.peerKey) || {
        key: pkt.peerKey,
        label: pkt.peerLabel,
        address: pkt.peerAddress,
        count: 0,
        firstSeen: pkt.time,
        lastSeen: pkt.time,
        latestPacketId: pkt.id,
        latestDirection: pkt.direction,
        protocols: new Set<string>(),
      }

      existing.count += 1
      existing.lastSeen = pkt.time
      existing.latestPacketId = pkt.id
      existing.latestDirection = pkt.direction
      existing.protocols.add(pkt.protocol)
      peerMap.set(pkt.peerKey, existing)
    })

    const peers = Array.from(peerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return peers.map((peer, index) => {
      const position = getBubblePosition(peer.key)
      return {
        ...peer,
        x: position.x,
        y: position.y,
        bubbleSize: Math.min(58 + peer.count * 8, 126),
      }
    })
  }, [getBubblePosition, packetFeed])

  const activePacketPeer = React.useMemo(() => {
    if (!movingPacket) return null
    return packetMapPeers.find(peer => peer.key === movingPacket.peerKey) || null
  }, [movingPacket, packetMapPeers])

  const packetStats = React.useMemo(() => {
    const incoming = packetFeed.filter(pkt => pkt.direction === "in").length
    const outgoing = packetFeed.filter(pkt => pkt.direction === "out").length
    const avgSize = packetFeed.length > 0
      ? Math.round(packetFeed.reduce((sum, pkt) => sum + pkt.size, 0) / packetFeed.length)
      : 0

    return { incoming, outgoing, avgSize }
  }, [packetFeed])

  return (
    <div className="flex flex-col h-full relative">
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-96 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex flex-col gap-1.5 rounded-xl border border-red-500/30 bg-background/95 p-4 shadow-2xl shadow-red-500/10 backdrop-blur-md animate-in slide-in-from-right fade-in duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-500">
                <span className="size-2 rounded-full bg-red-600 animate-ping" />
                {toast.title}
              </span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-foreground font-semibold font-mono break-words">{toast.packet?.source} ➔ {toast.packet?.destination}</p>
            <p className="text-xs text-muted-foreground break-words leading-relaxed">{toast.message}</p>
            <div className="mt-1 flex items-center justify-between gap-2 border-t pt-1.5 border-border/40">
              <Badge variant="outline" className="h-4 rounded px-1 text-[8.5px] uppercase border-red-500/30 text-red-500 bg-red-500/5">
                Severity: {toast.severity}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 px-1 text-[9px] text-red-500 hover:text-red-400 hover:bg-red-500/15"
                onClick={() => {
                  const packetsTrigger = document.querySelector('[value="packets"]') as HTMLButtonElement;
                  if (packetsTrigger) packetsTrigger.click();
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
              >
                Investigate →
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 shrink-0 z-10 relative px-4 md:px-8 top-4 md:top-8 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-semibold tracking-tight">Network Topology</h1>
          <p className="text-sm text-muted-foreground mt-1 bg-background/80 backdrop-blur rounded px-1 py-0.5 inline-block">
            Wi-Fi/Router in center with {globalNodes.length} device{globalNodes.length !== 1 ? 's' : ''} arranged in a circle.
          </p>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <select 
            className="flex h-9 w-50 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            <option value="all">All Networks</option>
            {uniqueNetworks.map((network) => (
              <option key={network} value={network}>{network}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 border">
            <Button 
              variant={layoutMode === "radial" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLayoutMode("radial")}
              title="Circular layout with router in center"
            >
              Radial
            </Button>
            <Button 
              variant={layoutMode === "hierarchical" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLayoutMode("hierarchical")}
              title="Hierarchical tree layout"
            >
              Tree
            </Button>
            <Button 
              variant={layoutMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLayoutMode("grid")}
              title="Grid layout"
            >
              Grid
            </Button>
          </div>

          <Button 
            variant="destructive" 
            className="gap-2 h-9 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
            onClick={injectSimulatedThreat}
          >
            <ActivitySquare className="size-4 animate-pulse" /> Simulate Threat
          </Button>

          <Button variant="outline" className="gap-2 h-9">
            <ScanLine className="size-4" /> Rescan Network
          </Button>
        </div>
      </div>

      <Tabs defaultValue="topology" className="flex flex-1 min-h-0 flex-col">
        <div className="mb-4 shrink-0">
          <TabsList className="bg-muted/60 border">
            <TabsTrigger value="topology" className="gap-2">
              <Network className="size-4" /> Topology
            </TabsTrigger>
            <TabsTrigger value="packets" className="gap-2 relative">
              <Wifi className="size-4" /> Packets
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white animate-pulse border border-background">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="topology" className="m-0 flex-1 min-h-0">
          <div className="flex-1 w-full border rounded-xl overflow-hidden relative h-full">
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
              maxZoom={2}
              className="bg-muted/5"
            >
              <Controls position="bottom-left" />
              <MiniMap 
                zoomable 
                pannable 
                nodeColor={(node) => {
                  const nodeIp = (node.data as any).ip as string | undefined;
                  if (nodeIp && maliciousIps.has(nodeIp)) return '#ef4444';
                  if (node.type === 'router') return '#b45309'
                  if (node.type === 'device') {
                    if ((node.data as any).alive) return '#059669'
                    return '#6b7280'
                  }
                  return '#94a3b8'
                }} 
                className="rounded-lg shadow-sm border bg-background"
              />
              <Background gap={24} size={2} color="#888" className="opacity-20" />
            </ReactFlow>

            <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur border rounded-lg p-4 shadow-lg max-w-xs">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Network Status
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-amber-500" />
                  <span>Router/Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500" />
                  <span>Connected Device (Active)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-gray-500" />
                  <span>Device (Offline)</span>
                </div>
                {maliciousIps.size > 0 && (
                  <div className="flex items-center gap-2 border-t pt-1.5 mt-1">
                    <div className="size-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-500 font-semibold font-mono text-xs">Threat Blocked ({maliciousIps.size})</span>
                  </div>
                )}
                <div className="border-t border-muted pt-2 mt-2">
                  <div className="text-xs text-muted-foreground">
                    <div>Total Devices: <span className="font-mono font-semibold text-foreground">{globalNodes.length}</span></div>
                    <div>From Targets: <span className="font-mono font-semibold text-foreground">{dbData.targets?.length || 0}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="packets" className="m-0 flex-1 min-h-0">
          <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1.0fr]">
            <Card className="border shadow-sm bg-background/90 overflow-hidden flex flex-col min-h-0">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ActivitySquare className="size-5 text-primary" /> Realtime Packet Flow
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Live network traffic sampled from the active topology view.</p>
                  </div>
                  {connectionStatus === "connected" && (
                    <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-4">
                <div className="mb-4 rounded-2xl border bg-background/95 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">Packet Discovery Map</div>
                      <p className="text-xs text-muted-foreground">Bubbles grow with packet count. Suspicious peer entities pulse in red.</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {packetMapPeers.length} discovered
                    </Badge>
                  </div>

                  <div className="relative h-96 overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.02),transparent)]">
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {activePacketPeer && movingPacket && (
                        <g>
                          <line
                            x1="50"
                            y1="50"
                            x2={50 + (activePacketPeer.x - 50) * motionProgress}
                            y2={50 + (activePacketPeer.y - 50) * motionProgress}
                            stroke={maliciousIps.has(activePacketPeer.address) ? "rgba(239,68,68,0.95)" : movingPacket.direction === "in" ? "rgba(59,130,246,0.95)" : "rgba(245,158,11,0.95)"}
                            strokeWidth="0.7"
                            strokeLinecap="round"
                            strokeDasharray="0.9 0.7"
                            style={{ opacity: 0.95 }}
                          />
                          <circle
                            cx={50 + (activePacketPeer.x - 50) * motionProgress}
                            cy={50 + (activePacketPeer.y - 50) * motionProgress}
                            r={1.25}
                            fill={maliciousIps.has(activePacketPeer.address) ? "rgb(239,68,68)" : movingPacket.direction === "in" ? "rgb(59,130,246)" : "rgb(245,158,11)"}
                            className="animate-pulse"
                          />
                        </g>
                      )}
                    </svg>

                    <div className="absolute inset-0">
                      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/10 shadow-lg shadow-primary/20">
                        <div className="flex flex-col items-center text-center">
                          <Wifi className="size-6 text-primary" />
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">Main</div>
                          <div className="max-w-20 truncate text-[10px] font-mono text-foreground/90">
                            {mainPacketDevice ? (mainPacketDevice.hostname || mainPacketDevice.ip) : "Hub"}
                          </div>
                        </div>
                        <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
                      </div>

                      {packetMapPeers.map((peer) => {
                        const isLatest = movingPacket?.peerKey === peer.key;
                        const isMalicious = maliciousIps.has(peer.address);
                        
                        const borderClass = isMalicious
                          ? "border-red-500 animate-threat-glow"
                          : isLatest
                            ? "border-primary/50 ring-4 ring-primary/15"
                            : "border-border/70";
                            
                        const ringBorderClass = isMalicious
                          ? "border-red-500/40 animate-ping"
                          : isLatest
                            ? "border-primary/30 animate-ping"
                            : "border-border/20";
                            
                        const nameClass = isMalicious
                          ? "text-red-500 font-bold"
                          : "text-foreground";

                        return (
                          <div
                            key={peer.key}
                            className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-all duration-500 ${isLatest ? "scale-105" : "scale-100"}`}
                            style={{ left: `${peer.x}%`, top: `${peer.y}%`, width: `${peer.bubbleSize}px`, height: `${peer.bubbleSize}px` }}
                          >
                            <div className={`relative flex h-full w-full items-center justify-center rounded-full border bg-background/95 shadow-md ${borderClass}`}>
                              <div className={`absolute -inset-2 rounded-full border ${ringBorderClass}`} />
                              <div className="flex flex-col items-center gap-0.5 px-2">
                                <div className={`max-w-16 truncate text-[9.5px] font-semibold leading-tight ${nameClass}`}>{peer.label}</div>
                                <div className="max-w-16 truncate text-[8px] font-mono text-muted-foreground">{peer.address}</div>
                                <Badge variant={isMalicious ? "destructive" : "secondary"} className="mt-1 h-3.5 rounded-full px-1.5 text-[8px] leading-none">
                                  {peer.count}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-1 max-w-24 text-[8px] uppercase tracking-wide text-muted-foreground truncate">
                              {isMalicious ? "☠️ Threat Source" : peer.count === 1 ? "New bubble" : `${peer.count} packets`}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 mb-4">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Packets Seen</div>
                    <div className="mt-1 text-2xl font-bold">{totalPacketsCount}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Inbound / Outbound</div>
                    <div className="mt-1 text-2xl font-bold">{packetStats.incoming} / {packetStats.outgoing}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Avg Size</div>
                    <div className="mt-1 text-2xl font-bold">{packetStats.avgSize}B</div>
                  </div>
                </div>

                <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col min-h-[380px] h-full">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Activity className="size-4 text-primary animate-pulse" />
                      Packet Stream
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPacketFeed([]);
                        setPacketAssessments({});
                        setTotalPacketsCount(0);
                      }}
                      className="h-8 text-xs"
                    >
                      Clear Stream
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[480px]">
                    {packetFeed.length > 0 ? packetFeed.map((pkt) => {
                      const isPktMalicious = packetAssessments[pkt.id]?.status === 'malicious';
                      const isPktPending = packetAssessments[pkt.id]?.status === 'pending';
                      const isPktBenign = packetAssessments[pkt.id]?.status === 'benign';
                      
                      return (
                        <div key={pkt.id} className={`grid gap-2 rounded-lg border px-3 py-3 md:grid-cols-[auto,1fr,auto] md:items-center transition-colors ${isPktMalicious ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/20'}`}>
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${pkt.direction === 'in' ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'}`}>
                            {pkt.direction === 'in' ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
                            {pkt.direction}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                              <span className="font-mono text-muted-foreground text-xs">{pkt.time}</span>
                              <Badge variant="outline" className="text-[10px] uppercase">{pkt.protocol}</Badge>
                              <span className="text-xs text-muted-foreground">{pkt.state}</span>
                            </div>
                            <div className="mt-1 font-mono text-xs leading-5 text-foreground wrap-break-word">
                              <span className="text-primary">{pkt.source}</span>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span>{pkt.destination}</span>
                            </div>
                            {pkt.info && (
                              <div className={`mt-1.5 text-[11px] font-mono break-all p-2 rounded-md border ${isPktMalicious ? 'bg-red-500/5 border-red-500/10 text-red-700 dark:text-red-400' : 'bg-muted/40 border-border/60 text-muted-foreground'}`}>
                                {pkt.info}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                            <Badge variant="secondary" className="font-mono text-[10px]">{pkt.size}B</Badge>
                            
                            <div className="flex items-center gap-1.5 mt-1">
                              {!packetAssessments[pkt.id] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[9px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded border gap-1"
                                  title="Analyze Packet with Local AI"
                                  onClick={() => analyzePacket(pkt)}
                                  disabled={isScanning}
                                >
                                  🧠 AI Scan
                                </Button>
                              )}
                              {isPktPending && (
                                <div className="flex items-center gap-1 text-[9px] text-amber-500 font-mono">
                                  <span className="size-2 border border-t-transparent border-amber-500 rounded-full animate-spin" />
                                  Analyzing...
                                </div>
                              )}
                              {isPktBenign && (
                                <Badge variant="outline" className="h-5 text-[9px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5" title={packetAssessments[pkt.id]?.reason}>
                                  ✓ Safe
                                </Badge>
                              )}
                              {isPktMalicious && (
                                <Badge variant="destructive" className="h-5 text-[9px] uppercase font-bold animate-pulse border-red-500 bg-red-600 text-white" title={packetAssessments[pkt.id]?.reason}>
                                  ☠️ {packetAssessments[pkt.id]?.severity || 'Threat'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="flex h-full min-h-64 items-center justify-center text-center text-muted-foreground">
                        <div>
                          <div className="mx-auto mb-3 size-12 rounded-full bg-muted flex items-center justify-center">
                            <Wifi className="size-5" />
                          </div>
                          <p className="font-medium">No packets captured yet.</p>
                          <p className="text-sm">The stream will populate as soon as network activity is sampled.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 content-start">
              <Card className="border shadow-sm bg-background/90 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className={`relative flex h-2.5 w-2.5`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${alerts.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${alerts.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      </span>
                      AI Threat Guard
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">Auto Scan</span>
                      <input
                        type="checkbox"
                        checked={autoScan}
                        onChange={(e) => setAutoScan(e.target.checked)}
                        className="rounded border-input bg-background"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div className={`p-3 rounded-lg border ${alerts.length > 0 ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'} flex items-center justify-between`}>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span>{alerts.length > 0 ? '⚠️ High-Risk Activity Detected' : '🛡️ All Shields Operational'}</span>
                    </div>
                    <Badge variant="outline" className={`text-[9px] uppercase ${alerts.length > 0 ? 'border-red-500/30 text-red-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                      {alerts.length} threats found
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {alerts.length > 0 ? alerts.map((alert) => {
                      const isBlocked = blockedIps.has(alert.srcIp) || blockedIps.has(alert.destIp);
                      return (
                        <div key={alert.id} className="p-2.5 rounded-lg border bg-muted/10 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{alert.time}</span>
                            <Badge variant="destructive" className="h-4 rounded px-1.5 text-[8px] leading-none uppercase font-bold border-red-500">
                              {alert.severity}
                            </Badge>
                          </div>
                          
                          <div className="text-[11px] font-mono leading-tight break-all font-semibold text-foreground">
                            <span>{alert.source}</span>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <span>{alert.destination}</span>
                          </div>
                          
                          <p className="text-[11px] text-muted-foreground leading-relaxed italic bg-muted/40 p-1.5 rounded border border-border/40">
                            {alert.reason}
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                            {isBlocked ? (
                              <Badge variant="outline" className="h-5 text-[9px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                                IP Blocked
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-5 px-1.5 text-[9px] text-red-500 hover:text-white hover:bg-red-500 border-red-500/30"
                                onClick={() => {
                                  setBlockedIps(prev => {
                                    const next = new Set(prev);
                                    if (alert.srcIp) next.add(alert.srcIp);
                                    if (alert.destIp) next.add(alert.destIp);
                                    return next;
                                  });
                                  addToast(
                                    "🛡️ FIREWALL BLOCK ACTIVE",
                                    `Traffic from/to ${alert.srcIp || alert.destIp} is now blacklisted.`,
                                    "medium",
                                    { source: alert.source, destination: alert.destination }
                                  );
                                }}
                              >
                                Block Sender IP
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-[9px] text-muted-foreground"
                              onClick={() => {
                                alert(`AI Investigation Report:\n\nPacket Details:\n- Time: ${alert.time}\n- Protocol: ${alert.protocol}\n- Source: ${alert.source}\n- Destination: ${alert.destination}\n- Payload: ${alert.info}\n\nLLM Threat Assessment:\n- Severity: ${alert.severity.toUpperCase()}\n- Assessment: ${alert.reason}`);
                              }}
                            >
                              Report Details
                            </Button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed rounded-lg">
                        <div className="relative mb-2">
                          <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm">
                            🛡️
                          </div>
                        </div>
                        <p className="text-xs font-medium">No alerts flagged</p>
                        <p className="text-[10px]">AI Scanner is actively monitoring incoming network packets.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-background/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Flow Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scope</div>
                    <div className="mt-1 font-medium">{selectedNetwork === 'all' ? 'All active networks' : selectedNetwork}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tracked Devices</div>
                    <div className="mt-1 font-medium">{networkDevices.length}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground font-mono flex justify-between items-center">
                      <span>Firewall Block List</span>
                      <Badge variant="outline" className="text-[9px]">{blockedIps.size} Blocked</Badge>
                    </div>
                    {blockedIps.size > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {Array.from(blockedIps).map(ip => (
                          <Badge key={ip} variant="secondary" className="text-[9px] gap-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                            {ip}
                            <button className="hover:text-red-700 cursor-pointer" onClick={() => setBlockedIps(prev => {
                              const next = new Set(prev);
                              next.delete(ip);
                              return next;
                            })}>✕</button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 font-medium text-xs text-muted-foreground">No blocked addresses.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-background/90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">AI Threat Assessment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <p>Suspicious packets containing potential command injections, remote file includes, or TCP scans are forwarded to the local `qwen3:1.7b` LLM model for detailed risk categorization and contextual explanation.</p>
                  <p>Use the <strong>Simulate Threat</strong> button to immediately trigger a test attack and verify end-to-end alert pipelines.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
