import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const client = await clientPromise;
    const db = client.db('inids_dashboard');
    
    // Default shape based on the app UI expected data
    const newTarget = {
      organizationName: payload.organizationName,
      domain: payload.domain,
      industry: payload.industry || "Unknown",
      status: "Scanning",
      lastScan: "Just now",
      assets: 0, // Initial counts
      vulnerabilities: { critical: 0, high: 0 },
      riskScore: 0,
      createdAt: new Date(),
    };

    const result = await db.collection('targets').insertOne(newTarget);

    return NextResponse.json(
      { success: true, target: { ...newTarget, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add target:", error);
    return NextResponse.json(
      { error: 'Failed to create target' },
      { status: 500 }
    );
  }
}
