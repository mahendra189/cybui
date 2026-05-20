import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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

export async function POST() {
  try {
    console.log('[API] Starting network scan...');
    
    // Fetch scan results from the external service
    const scanRes = await fetch('http://127.0.0.1:8000/scan');
    if (!scanRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch scan data' }, { status: 502 });
    }
    const scanData = await scanRes.json();
    if (!scanData.success || !Array.isArray(scanData.devices)) {
      return NextResponse.json({ error: 'Invalid scan data' }, { status: 500 });
    }

    const client = await clientPromise;
    const db = client.db('inids_dashboard');
    const targetsCol = db.collection('targets');
    const portsCol = db.collection('ports');
    const servicesCol = db.collection('services');

    // Remove all previous targets and related data
    await targetsCol.deleteMany({});
    await portsCol.deleteMany({});
    await servicesCol.deleteMany({});

    // Insert new targets from scan with initial status
    const targets = scanData.devices.map((device: any) => ({
      ip: device.ip,
      mac: device.mac,
      hostname: device.hostname,
      latency_ms: device.latency_ms,
      alive: device.alive,
      os_guess: device.os_guess,
      device_type: device.device_type,
      open_ports: device.open_ports || [],
      interface: scanData.interface,
      local_ip: scanData.local_ip,
      subnet_mask: scanData.subnet_mask,
      network: scanData.network,
      scan_time_seconds: scanData.scan_time_seconds,
      port_scan_status: 'pending',
      port_scan_count: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    if (targets.length > 0) {
      await targetsCol.insertMany(targets);
    }

    console.log(`[API] Network scan complete. Found ${targets.length} devices. Starting background port scans...`);

    // Start background port scanning immediately (non-blocking)
    setImmediate(async () => {
      try {
        console.log('[>>> BULK SCAN] Background port scanning started');
        
        const aliveTargets = await targetsCol.find({ alive: true }).toArray();
        console.log(`[>>> BULK SCAN] Found ${aliveTargets.length} alive targets to scan`);

        for (const target of aliveTargets) {
          try {
            console.log(`[>>> BULK SCAN] Scanning ${target.ip}...`);
            
            // Update status to scanning
            await targetsCol.updateOne(
              { _id: target._id },
              { $set: { port_scan_status: 'scanning', port_scan_started: new Date() } }
            );

            // Scan ports from external service
            let openPorts = [];
            try {
              const portScanRes = await fetch('http://127.0.0.1:8000/scan_ports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: target.ip }),
                signal: AbortSignal.timeout(30000)
              });

              if (portScanRes.ok) {
                const result = await portScanRes.json();
                openPorts = result.open_ports || [];
                console.log(`[>>> BULK SCAN] ${target.ip} - Found ${openPorts.length} open ports`);
              } else {
                console.log(`[>>> BULK SCAN] Port scan service returned ${portScanRes.status}`);
              }
            } catch (scanErr: any) {
              console.warn(`[>>> BULK SCAN] Port scan error for ${target.ip}:`, scanErr.message);
            }

            // Store ports in database
            if (openPorts.length > 0) {
              const portDocs = openPorts.map((port: any) => ({
                targetId: String(target._id),
                targetIP: target.ip,
                port: String(port.port),
                protocol: port.protocol || 'tcp',
                service: port.service || getServiceName(port.port),
                discoveredAt: new Date(),
                state: 'open'
              }));

              await portsCol.insertMany(portDocs);

              // Create services from ports
              const serviceDocs = portDocs
                .filter((p: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.port === p.port && x.service === p.service) === idx)
                .map((p: any) => ({
                  targetId: String(target._id),
                  targetIP: target.ip,
                  name: p.service,
                  port: p.port,
                  protocol: p.protocol,
                  version: 'Detected',
                  riskScore: getRiskScore(p.service),
                  discoveredAt: new Date()
                }));

              if (serviceDocs.length > 0) {
                await servicesCol.insertMany(serviceDocs);
              }
            }

            // Update status to completed
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

            console.log(`[>>> BULK SCAN] ${target.ip} - Scan completed`);
          } catch (err) {
            console.error(`[>>> BULK SCAN] Error scanning ${target.ip}:`, err);
            await targetsCol.updateOne(
              { _id: target._id },
              { $set: { port_scan_status: 'failed', port_scan_completed: new Date() } }
            );
          }
        }

        console.log('[>>> BULK SCAN] Background port scanning completed');
      } catch (err) {
        console.error('[>>> BULK SCAN] Fatal error in background scanning:', err);
      }
    });

    return NextResponse.json({ 
      success: true, 
      targets,
      message: 'Network scan complete. Port scanning started in background.'
    });
  } catch (error) {
    console.error('[API] Scan and save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
