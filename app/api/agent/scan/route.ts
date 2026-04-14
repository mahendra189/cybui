import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from "@/lib/auth";

export const maxDuration = 900; // Increased to 15 minutes for long-running pipeline scans
export const dynamic = 'force-dynamic';

const COMMON_PORTS: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  111: "RPCBind",
  135: "MSRPC",
  139: "NetBIOS",
  143: "IMAP",
  443: "HTTPS",
  445: "Microsoft-DS",
  993: "IMAPS",
  995: "POP3S",
  1723: "PPTP",
  3306: "MySQL",
  3389: "RDP",
  5432: "PostgreSQL",
  5900: "VNC",
  6379: "Redis",
  8000: "HTTP-Alt",
  8080: "HTTP-Proxy",
  8443: "HTTPS-Alt",
  9000: "Portainer",
  27017: "MongoDB"
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const userRole = session.user.role;
    if (userRole === "customer") {
      return NextResponse.json({ error: "Insufficient permissions. Customers cannot initiate scans." }, { status: 403 });
    }

    const payload = await request.json();
    const targetId = payload.targetId || "TGT-UNKNOWN";
    const scanMode = payload.mode || "fast";

    const client = await clientPromise;
    const db = client.db('cyb_dashboard');

    // Fetch the target to get the domain
    let targetDoc: any = null;
    try {
      targetDoc = await db.collection('targets').findOne({
        $or: [
          { id: targetId },
          { _id: targetId },
          { _id: new ObjectId(targetId) }
        ]
      });
    } catch (e) {
      targetDoc = await db.collection('targets').findOne({ id: targetId });
    }

    const targetDomain = targetDoc?.domain || targetDoc?.primaryDomain || targetDoc?.name || "example.com";
    console.log(`>>> PROXYING AGENT SCAN [Mode: ${scanMode.toUpperCase()}] FOR DOMAIN: [${targetDomain}] (TargetID: ${targetId})`);

    // Query the external agent backend using the new pipeline endpoint
    const agentResponse = await fetch("http://127.0.0.1:8000/api/scan_domain_pipeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain: targetDomain, mode: scanMode }),
      signal: AbortSignal.timeout(900000) // 15 minutes timeout
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent backend responded with status: ${agentResponse.status}`);
    }

    const parsedData = await agentResponse.json();

    console.log("--- AGENT PIPELINE RESPONSE RECEIVED ---");

    // Clear existing data for this target to ensure a clean "update"
    // This prevents duplicate findings and stale data from appearing in the dashboard.
    console.log(`>>> Cleaning up old records for TargetID: [${targetId}]`);
    await db.collection('assets').deleteMany({ targetId });
    await db.collection('ports').deleteMany({ targetId });
    await db.collection('services').deleteMany({ targetId });

    // Update the backend database matching schemas...
    let insertedAssets = 0;
    let insertedPorts = 0;
    let insertedServices = 0;
    let topologyUpdated = false;

    // 1. Process Assets
    let assetsToInsert: any[] = [];
    if (parsedData?.assets && Array.isArray(parsedData.assets)) {
      assetsToInsert = parsedData.assets.map((a: any) => ({
        targetId,
        subdomain: a.subdomain,
        name: a.subdomain || "Unknown Asset",
        status: 'Active',
        lastScanned: new Date(),
        ip: a.ip || "Pending..."
      }));
      
      if (assetsToInsert.length > 0) {
        await db.collection('assets').insertMany(assetsToInsert);
        insertedAssets = assetsToInsert.length;
      }

      // Grouping logic for Ports and Services
      const portGroups: Record<number, any> = {};
      const serviceGroups: Record<string, any> = {};

      parsedData.assets.forEach((a: any) => {
        if (a.ports && Array.isArray(a.ports)) {
          a.ports.forEach((portNumber: number) => {
            const serviceName = COMMON_PORTS[portNumber] || "Unknown Service";
            
            // Group for Ports collection
            if (!portGroups[portNumber]) {
              portGroups[portNumber] = {
                targetId,
                portNumber,
                protocol: "TCP",
                service: serviceName,
                description: `${serviceName} protocol on port ${portNumber}`,
                state: "open",
                assets: []
              };
            }
            portGroups[portNumber].assets.push({
              id: a.subdomain,
              name: a.subdomain,
              ip: a.ip || "Pending...",
              lastDetected: new Date().toISOString()
            });

            // Group for Services collection
            if (!serviceGroups[serviceName]) {
              serviceGroups[serviceName] = {
                targetId,
                name: serviceName,
                type: serviceName,
                port: portNumber,
                protocol: "TCP",
                version: "Detected",
                riskScore: portNumber === 80 ? 85 : 20, // Example risk score
                lastSeen: new Date(),
                assets: []
              };
            }
            serviceGroups[serviceName].assets.push({
              id: a.subdomain,
              name: a.subdomain,
              ip: a.ip || "Pending...",
              assetRisk: 20
            });
          });
        }
      });

      const finalPorts = Object.values(portGroups);
      const finalServices = Object.values(serviceGroups);

      if (finalPorts.length > 0) {
        await db.collection('ports').insertMany(finalPorts);
        insertedPorts = finalPorts.length;
      }

      if (finalServices.length > 0) {
        await db.collection('services').insertMany(finalServices);
        insertedServices = finalServices.length;
      }
    }

    // Handle topology
    if (parsedData?.topology) {
      // Store topology for this target
      await db.collection('topology').updateOne(
        { targetId },
        { $set: { ...parsedData.topology, updatedAt: new Date() } },
        { upsert: true }
      );
      topologyUpdated = true;
    }

    // Update targets status
    if (parsedData?.targets && Array.isArray(parsedData.targets)) {
      for (const t of parsedData.targets) {
        await db.collection('targets').updateOne(
          { name: t.name },
          { $set: { ...t, lastCompletedScan: new Date(), status: 'Idle' } },
          { upsert: true }
        );
      }
    } else {
      // Fallback: update the current target status to Idle
      await db.collection('targets').updateOne(
        { id: targetId },
        { $set: { status: 'Idle', lastCompletedScan: new Date() } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Pipeline scan complete: ${insertedAssets} assets, ${insertedPorts} ports discovered.`,
        stats: { assets: insertedAssets, ports: insertedPorts, services: insertedServices, topologyUpdated },
        agentOutput: parsedData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Agent pipeline execution failed:", error);
    return NextResponse.json(
      { error: error.name === 'AbortError' ? 'Scan timed out' : 'Failed to process pipeline scan' },
      { status: 500 }
    );
  }
}
