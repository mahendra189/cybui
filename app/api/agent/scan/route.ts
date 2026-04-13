import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from "@/lib/auth";

export const maxDuration = 900; // Increased to 15 minutes for long-running pipeline scans
export const dynamic = 'force-dynamic';

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
    console.log(`>>> PROXYING AGENT SCAN FOR DOMAIN: [${targetDomain}] (TargetID: ${targetId})`);

    // Query the external agent backend using the new pipeline endpoint
    // We use a very long timeout (15 minutes) to allow the backend to complete its scan.
    // The UND_ERR_HEADERS_TIMEOUT error often happens when the connection is closed 
    // by the environment (e.g. 5 min limit) before headers are received.
    const agentResponse = await fetch("http://127.0.0.1:8000/api/scan_domain_pipeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain: targetDomain }),
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
    if (parsedData?.assets && Array.isArray(parsedData.assets)) {
      const assetsToInsert = parsedData.assets.map((a: any) => ({ 
        ...a, 
        targetId, 
        lastScanned: new Date(),
        status: a.status || 'Active'
      }));
      if (assetsToInsert.length > 0) {
        await db.collection('assets').insertMany(assetsToInsert);
        insertedAssets = assetsToInsert.length;
      }

      // If ports/services aren't at top level, try to extract them from assets
      // We look for 'ports', 'exposedServices', or 'services' inside each asset
      const extractedPorts: any[] = [];
      const extractedServices: any[] = [];

      parsedData.assets.forEach((a: any) => {
        // Try to find ports in various common schemas
        const portsList = a.ports || a.exposedServices || a.services;
        if (portsList && Array.isArray(portsList)) {
          portsList.forEach((p: any) => {
            // Normalize port data
            const portData = {
              ...p,
              targetId,
              hostIp: a.ip || a.internalIp || p.hostIp || "Unknown",
              portNumber: p.portNumber || p.port,
              service: p.service || p.serviceName || p.description || "Unknown",
              protocol: p.protocol || "TCP",
              state: p.state || "open"
            };
            extractedPorts.push(portData);

            // Also create a service entry if it looks like a service
            extractedServices.push({
              targetId,
              name: portData.service,
              port: portData.portNumber,
              protocol: portData.protocol,
              lastSeen: new Date(),
              assetId: a.id || a._id || null
            });
          });
        }
      });

      if (extractedPorts.length > 0 && (!parsedData.ports || !Array.isArray(parsedData.ports))) {
          await db.collection('ports').insertMany(extractedPorts);
          insertedPorts = extractedPorts.length;
      }

      if (extractedServices.length > 0 && (!parsedData.services || !Array.isArray(parsedData.services))) {
          await db.collection('services').insertMany(extractedServices);
          insertedServices = extractedServices.length;
      }
    }
    
    // 2. Process Top-level Ports (if provided and we haven't already extracted from assets)
    if (parsedData?.ports && Array.isArray(parsedData.ports) && insertedPorts === 0) {
      const portsToInsert = parsedData.ports.map((p: any) => ({ ...p, targetId }));
      if (portsToInsert.length > 0) {
        await db.collection('ports').insertMany(portsToInsert);
        insertedPorts = portsToInsert.length;
      }
    }
    
    // 3. Process Top-level Services (if provided and we haven't already extracted from assets)
    if (parsedData?.services && Array.isArray(parsedData.services) && insertedServices === 0) {
      const servicesToInsert = parsedData.services.map((s: any) => ({ ...s, targetId }));
      if (servicesToInsert.length > 0) {
        await db.collection('services').insertMany(servicesToInsert);
        insertedServices = servicesToInsert.length;
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
