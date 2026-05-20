import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from "@/lib/auth";

// Helper function to get service name from port
function getServiceName(port: string | number): string {
  const portNum = parseInt(String(port));
  const commonPorts: Record<number, string> = {
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    445: 'SMB',
    465: 'SMTPS',
    587: 'SMTP',
    636: 'LDAPS',
    993: 'IMAPS',
    995: 'POP3S',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    5900: 'VNC',
    6379: 'Redis',
    8080: 'HTTP-Proxy',
    8443: 'HTTPS-Alt',
    9200: 'Elasticsearch',
    27017: 'MongoDB',
    50070: 'Hadoop'
  };
  return commonPorts[portNum] || `Service-${portNum}`;
}

// Helper function to determine risk score
function getRiskScore(service: string | undefined): string {
  const highRiskServices = ['Telnet', 'FTP', 'HTTP', 'SMB', 'RDP'];
  const mediumRiskServices = ['SSH', 'SMTP', 'MySQL', 'PostgreSQL', 'MongoDB'];

  if (!service) return 'Low';
  if (highRiskServices.some(s => service.includes(s))) return 'High';
  if (mediumRiskServices.some(s => service.includes(s))) return 'Medium';
  return 'Low';
}

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
        console.log(`>>> Port scan for ${targetIP}: ${scanResult.open_ports?.length || 0} ports found`);
      } else {
        console.warn(`Port scan service returned status ${scanRes.status}`);
      }
    } catch (scanErr) {
      console.error(`Port scanning service error: ${scanErr}`);
      // Fall back to empty ports list
      scanResult = { open_ports: [] };
    }

    // Process port data with service information
    const openPorts = Array.isArray(scanResult.open_ports) ? scanResult.open_ports.map((p: any) => ({
      port: p.port,
      protocol: p.protocol || 'tcp',
      service: p.service || getServiceName(p.port),
      state: 'open'
    })) : [];

    // Store ports in database
    const portsCol = db.collection('ports');
    const servicesCol = db.collection('services');
    
    // Delete previous ports and services for this target
    await portsCol.deleteMany({ targetId: String(target._id) });
    await servicesCol.deleteMany({ targetId: String(target._id) });

    // Insert new ports
    if (openPorts.length > 0) {
      const portDocs = openPorts.map(p => ({
        targetId: String(target._id),
        targetIP: targetIP,
        port: String(p.port),
        protocol: p.protocol,
        service: p.service,
        discoveredAt: new Date(),
        state: p.state
      }));
      await portsCol.insertMany(portDocs);

      // Create services from ports
      const serviceDocs = openPorts
        .filter((p, idx, arr) => arr.findIndex(x => x.port === p.port && x.service === p.service) === idx)
        .map(p => ({
          targetId: String(target._id),
          targetIP: targetIP,
          name: p.service,
          port: String(p.port),
          protocol: p.protocol,
          version: 'Detected',
          riskScore: getRiskScore(p.service),
          discoveredAt: new Date()
        }));
      if (serviceDocs.length > 0) {
        await servicesCol.insertMany(serviceDocs);
      }
    }
    
    // Update target with scan results
    await db.collection('targets').updateOne(query, {
      $set: {
        open_ports: openPorts.map(p => ({ port: p.port, protocol: p.protocol, service: p.service })),
        port_scan_status: 'completed',
        port_scan_completed: new Date(),
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
