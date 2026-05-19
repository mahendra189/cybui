import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
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

    // Remove all previous targets (optional, or upsert by IP)
    await targetsCol.deleteMany({});

    // Insert new targets from scan
    const targets = scanData.devices.map(device => ({
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
      createdAt: new Date(),
    }));
    if (targets.length > 0) {
      await targetsCol.insertMany(targets);
    }

    return NextResponse.json({ success: true, targets });
  } catch (error) {
    console.error('Scan and save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
