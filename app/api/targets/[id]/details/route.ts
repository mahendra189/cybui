import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from "@/lib/auth";

export async function GET(
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

    // Find target by ID
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

    // Fetch associated ports
    const ports = await db.collection('ports')
      .find({ targetId: targetIdString })
      .toArray();

    // Fetch associated services
    const services = await db.collection('services')
      .find({ targetId: targetIdString })
      .toArray();

    return NextResponse.json({
      target,
      ports,
      services
    });
  } catch (error: any) {
    console.error("Failed to fetch target details:", error);
    return NextResponse.json(
      { error: 'Failed to fetch target details' },
      { status: 500 }
    );
  }
}
