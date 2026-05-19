import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';

/**
 * Radial/Circular Layout - Router in center, devices arranged in circle
 * Perfect for star topology networks
 */
export function getRadialLayout(
  devices: any[],
  routerNode: Node
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [routerNode];
  const edges: Edge[] = [];

  const centerX = 0;
  const centerY = 0;
  const radius = 350; // Distance from center to devices
  const deviceCount = devices.length;

  devices.forEach((device, index) => {
    const angle = (index / deviceCount) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const deviceId = device.id;
    nodes.push({
      id: deviceId,
      type: "device",
      position: { x, y },
      data: {
        id: deviceId,
        realId: device._id || device.id || device.ip,
        hostname: device.hostname || device.ip,
        ip: device.ip,
        mac: device.mac,
        alive: device.alive,
        latency_ms: device.latency_ms,
        os_guess: device.os_guess,
        device_type: device.device_type,
        open_ports: device.open_ports || [],
      },
    });

    // Connect device to router
    edges.push({
      id: `edge-router-${deviceId}`,
      source: routerNode.id,
      target: deviceId,
      type: "smoothstep",
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      animated: device.alive,
    });
  });

  return { nodes, edges };
}

/**
 * Hierarchical/Tree Layout using Dagre
 * Better for complex network topologies with multiple levels
 */
export function getHierarchicalLayout(
  devices: any[],
  routerNode: Node
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph({ directed: true });
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  // Create nodes
  const nodes: Node[] = [routerNode];
  g.setNode(routerNode.id, { width: 100, height: 100 });

  devices.forEach((device) => {
    const deviceId = device.id;
    nodes.push({
      id: deviceId,
      type: "device",
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        id: deviceId,
        realId: device._id || device.id || device.ip,
        hostname: device.hostname || device.ip,
        ip: device.ip,
        mac: device.mac,
        alive: device.alive,
        latency_ms: device.latency_ms,
        os_guess: device.os_guess,
        device_type: device.device_type,
        open_ports: device.open_ports || [],
      },
    });
    g.setNode(deviceId, { width: 160, height: 120 });
  });

  // Create edges
  const edges: Edge[] = [];
  devices.forEach((device) => {
    const deviceId = device.id;
    g.setEdge(routerNode.id, deviceId);
    edges.push({
      id: `edge-router-${deviceId}`,
      source: routerNode.id,
      target: deviceId,
      type: "smoothstep",
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      animated: device.alive,
    });
  });

  // Run layout algorithm
  dagre.layout(g);

  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    if (nodeWithPosition) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - (nodeWithPosition.width ?? 0) / 2,
          y: nodeWithPosition.y - (nodeWithPosition.height ?? 0) / 2,
        },
      };
    }
    return node;
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Grid Layout - Devices arranged in a grid pattern
 * Good for large numbers of devices
 */
export function getGridLayout(
  devices: any[],
  routerNode: Node
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [routerNode];
  const edges: Edge[] = [];

  const cols = Math.ceil(Math.sqrt(devices.length));
  const spacing = 250;
  const startX = -((cols - 1) * spacing) / 2;
  const startY = 200;

  devices.forEach((device, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * spacing;
    const y = startY + row * spacing;

    const deviceId = device.id;
    nodes.push({
      id: deviceId,
      type: "device",
      position: { x, y },
      data: {
        id: deviceId,
        realId: device._id || device.id || device.ip,
        hostname: device.hostname || device.ip,
        ip: device.ip,
        mac: device.mac,
        alive: device.alive,
        latency_ms: device.latency_ms,
        os_guess: device.os_guess,
        device_type: device.device_type,
        open_ports: device.open_ports || [],
      },
    });

    // Connect device to router
    edges.push({
      id: `edge-router-${deviceId}`,
      source: routerNode.id,
      target: deviceId,
      type: "smoothstep",
      style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      animated: device.alive,
    });
  });

  return { nodes, edges };
}
