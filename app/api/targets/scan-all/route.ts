import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
    console.log('[>>> BULK SCAN] Starting bulk port scan for all targets...');
    
    const client = await clientPromise;
    const db = client.db('inids_dashboard');
    const targetsCol = db.collection('targets');
    const portsCol = db.collection('ports');
    const servicesCol = db.collection('services');

    // Find all alive targets (regardless of scan status)
    const targets = await targetsCol.find({ alive: true }).toArray();
    console.log(`[>>> BULK SCAN] Found ${targets.length} alive targets to scan`);

    const scanResults = [];

    // Scan each target sequentially to avoid overwhelming the external service
    for (const target of targets) {
      console.log(`[>>> BULK SCAN] Processing target: ${target.ip}`);
      try {
        // Update target status to scanning
        console.log(`[>>> BULK SCAN] ${target.ip} - Updating status to scanning`);
        await targetsCol.updateOne(
          { _id: target._id },
          {
            $set: {
              port_scan_status: 'scanning',
              port_scan_started: new Date()
            }
          }
        );

        // Call external port scan service
        let openPorts = [];
        try {
          const scanRes = await fetch('http://127.0.0.1:8000/scan_ports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: target.ip }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });

          if (scanRes.ok) {
            const result = await scanRes.json();
            openPorts = result.open_ports || [];
          }
        } catch (scanErr) {
          console.warn(`[API] Port scan failed for ${target.ip}:`, scanErr);
        }

        // Store ports in DB
        if (openPorts.length > 0) {
          const portDocs = openPorts.map((port: any, idx: number) => {
            const portStr = typeof port === 'string' ? port : (port.port || port.portNumber);
            const parts = String(portStr).split('/');
            const portNum = parts[0];
            const protocol = parts[1] || 'tcp';

            return {
              targetId: String(target._id),
              targetIP: target.ip,
              port: portNum,
              protocol: protocol,
              service: getServiceName(portNum),
              discoveredAt: new Date(),
              state: 'open'
            };
          });

          await portsCol.deleteMany({ targetId: String(target._id) });
          if (portDocs.length > 0) {
            await portsCol.insertMany(portDocs);
          }

          // Create services from ports
          const serviceDocs = portDocs
            .map((p: any) => ({
              targetId: String(target._id),
              targetIP: target.ip,
              name: p.service,
              port: p.port,
              protocol: p.protocol,
              version: 'Detected',
              riskScore: getRiskScore(p.service),
              discoveredAt: new Date()
            }))
            .filter((s: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.name === s.name && x.port === s.port) === idx);

          await servicesCol.deleteMany({ targetId: String(target._id) });
          if (serviceDocs.length > 0) {
            await servicesCol.insertMany(serviceDocs);
          }
        }

        // Update target with completion status
        console.log(`[>>> BULK SCAN] ${target.ip} - Completed. Found ${openPorts.length} ports`);
        await targetsCol.updateOne(
          { _id: target._id },
          {
            $set: {
              port_scan_status: 'completed',
              port_scan_completed: new Date(),
              open_ports: openPorts,
              port_scan_count: (target.port_scan_count || 0) + 1
            }
          }
        );

        scanResults.push({
          ip: target.ip,
          status: 'completed',
          portsFound: openPorts.length
        });
      } catch (err) {
        console.error(`[>>> BULK SCAN] Error scanning ${target.ip}:`, err);
        
        // Mark as failed
        await targetsCol.updateOne(
          { _id: target._id },
          {
            $set: {
              port_scan_status: 'failed',
              port_scan_completed: new Date()
            }
          }
        );

        scanResults.push({
          ip: target.ip,
          status: 'failed'
        });
      }
    }

    console.log(`[>>> BULK SCAN] Completed scanning ${scanResults.length} targets. Results:`, scanResults);
    return NextResponse.json({
      success: true,
      scanCount: targets.length,
      results: scanResults
    });
  } catch (error) {
    console.error('[>>> BULK SCAN] Bulk port scan error:', error);
    return NextResponse.json(
      { error: 'Bulk port scan failed', details: String(error) },
      { status: 500 }
    );
  }
}

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
