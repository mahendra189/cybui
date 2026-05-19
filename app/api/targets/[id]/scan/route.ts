import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from "@/lib/auth";

export const maxDuration = 300; // Allow up to 5 minutes for port scanning

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetIdString = String(id);
    const client = await clientPromise;
    const db = client.db('inids_dashboard');

    // Find the target by ID
    let query: any = { id: targetIdString };
    if (/^[0-9a-fA-F]{24}$/.test(targetIdString)) {
      query = { 
        $or: [
          { _id: new ObjectId(targetIdString) },
          { id: targetIdString }
        ] 
      };
    }

    const target = await db.collection('targets').findOne(query);
    if (!target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    const targetIP = target.ip;
    console.log(`>>> SCANNING PORTS FOR TARGET: [${targetIP}]`);

    // Call the external port scanning service
    let scanResult: any = { open_ports: [] };
    
    try {
      const scanRes = await fetch('http://127.0.0.1:8000/scan_ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIP })
      });

      if (scanRes.ok) {
        scanResult = await scanRes.json();
      } else {
        console.warn(`Port scan service returned status ${scanRes.status}`);
      }
    } catch (scanErr) {
      console.error(`Port scanning service error: ${scanErr}`);
      // Fall back to empty ports list
      scanResult = { open_ports: [] };
    }

    // Update the target with new scan data
    const openPorts = Array.isArray(scanResult.open_ports) ? scanResult.open_ports : [];
    
    const updateResult = await db.collection('targets').updateOne(query, {
      $set: {
        open_ports: openPorts,
        last_port_scan: new Date(),
        port_scan_count: (target.port_scan_count || 0) + 1
      }
    });

    console.log(`>>> Updated target [${targetIP}] with ${openPorts.length} open ports`);

    return NextResponse.json({
      success: true,
      targetId: targetIdString,
      ip: targetIP,
      open_ports: openPorts,
      scanned_at: new Date()
    });
  } catch (error: any) {
    console.error("Port scan failed:", error);
    return NextResponse.json(
      { error: 'Port scanning failed' },
      { status: 500 }
    );
  }
}
