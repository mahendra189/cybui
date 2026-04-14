import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from "@/lib/auth";

export async function DELETE(
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
    const db = client.db('cyb_dashboard');

    console.log(`>>> DELETING TARGET [${targetIdString}]`);

    // 1. Delete the target itself
    // We try to match by _id (as ObjectId) OR by id (as string)
    let query: any = { id: targetIdString };
    
    // If it looks like a 24-char hex string, also try matching by _id
    if (/^[0-9a-fA-F]{24}$/.test(targetIdString)) {
      query = { 
        $or: [
          { _id: new ObjectId(targetIdString) },
          { id: targetIdString }
        ] 
      };
    }

    const targetDeleteResult = await db.collection('targets').deleteOne(query);

    if (targetDeleteResult.deletedCount === 0) {
      console.warn(`Target [${targetIdString}] not found in Mongo.`);
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    // 2. Cascade delete related resources
    console.log(`>>> Cleaning up related resources for TargetID: [${targetIdString}]`);
    
    const assetsResult = await db.collection('assets').deleteMany({ targetId: targetIdString });
    const portsResult = await db.collection('ports').deleteMany({ targetId: targetIdString });
    const servicesResult = await db.collection('services').deleteMany({ targetId: targetIdString });
    const topologyResult = await db.collection('topology').deleteMany({ targetId: targetIdString });

    return NextResponse.json({
      success: true,
      message: 'Target and all associated data deleted successfully',
      stats: {
        assetsDeleted: assetsResult.deletedCount,
        portsDeleted: portsResult.deletedCount,
        servicesDeleted: servicesResult.deletedCount,
        topologyDeleted: topologyResult.deletedCount
      }
    });
  } catch (error: any) {
    console.error("Failed to delete target:", error);
    return NextResponse.json(
      { error: 'Failed to process target deletion' },
      { status: 500 }
    );
  }
}
