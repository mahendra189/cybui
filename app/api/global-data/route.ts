import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const targetId = searchParams.get('targetId');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("inids_dashboard");

    // If a specific type is requested with pagination
    if (type && ['assets', 'ports', 'services'].includes(type)) {
      const isGlobal = !targetId || targetId === 'all';
      
      // If Global View for Ports or Services, we need to GROUP them to combine across targets
      if (isGlobal && (type === 'ports' || type === 'services')) {
        const groupByField = type === 'ports' ? 'portNumber' : 'name';
        const sortField = type === 'ports' ? 'portNumber' : '_id';

        const pipeline: any[] = [
          {
            $group: {
              _id: type === 'ports' ? { port: "$portNumber", proto: "$protocol" } : "$name",
              portNumber: { $first: "$portNumber" },
              name: { $first: "$name" },
              protocol: { $first: "$protocol" },
              service: { $first: "$service" },
              type: { $first: "$type" },
              version: { $first: "$version" },
              description: { $first: "$description" },
              riskScore: { $avg: "$riskScore" },
              assets: { $push: "$assets" },
              state: { $first: "$state" }
            }
          },
          // Flatten the assets array (since it's an array of arrays now)
          {
            $project: {
              id: type === 'ports' 
                ? { $concat: [{ $toString: "$portNumber" }, "-", "$protocol"] }
                : "$_id",
              portNumber: 1,
              name: 1,
              protocol: 1,
              service: 1,
              type: 1,
              version: 1,
              description: 1,
              riskScore: 1,
              state: 1,
              assets: {
                $reduce: {
                  input: "$assets",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] }
                }
              }
            }
          },
          { $sort: { [sortField]: 1 } }
        ];

        // Get total count of groups
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await db.collection(type).aggregate(countPipeline).toArray();
        const total = countResult[0]?.total || 0;

        // Apply pagination to pipeline
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        const items = await db.collection(type).aggregate(pipeline).toArray();

        return NextResponse.json({
          data: items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        });
      }

      // Standard non-grouped view (Assets or filtered Target view)
      const query = targetId && targetId !== 'all' ? { targetId } : {};
      
      let sortOrder: any = {};
      if (type === 'ports') sortOrder = { portNumber: 1 };
      else if (type === 'services') sortOrder = { name: 1 };
      else sortOrder = { createdAt: -1 };

      const [items, total] = await Promise.all([
        db.collection(type).find(query).sort(sortOrder).skip(skip).limit(limit).toArray(),
        db.collection(type).countDocuments(query)
      ]);

      return NextResponse.json({
        data: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    // Default: Fetch everything (summary view)
    // We remove the strict 100 limit to ensure all discoveries are visible in the dashboard
    // If a targetId is provided, we filter specifically for that target's entities
    const query = targetId && targetId !== 'all' ? { targetId } : {};

    const [targets, assets, services, ports, topology] = await Promise.all([
      db.collection("targets").find({}).toArray(),
      db.collection("assets").find(query).toArray(),
      db.collection("services").find(query).toArray(),
      db.collection("ports").find(query).toArray(),
      db.collection("topology").find(query).limit(10).toArray(),
    ]);

    return NextResponse.json({ targets, assets, services, ports, topology });
  } catch (error) {
    console.error("MongoDB fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch data from MongoDB" }, { status: 500 });
  }
}
