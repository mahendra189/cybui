import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export const maxDuration = 300; // Increased for deep SSL scans

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("cyb_dashboard");
    const record = await db.collection("ssl_scans").findOne({ assetId });

    if (!record) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: record.sslData, scannedAt: record.scannedAt });
  } catch (error: any) {
    console.error("SSL fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch SSL data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain, assetId } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    console.log(`>>> PROXYING TESTSSL SCAN FOR: [${domain}]`);

    // Proxy the request to the agent backend
    const agentResponse = await fetch("http://localhost:8000/api/testssl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host: domain, port: 443 })
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error(`Backend Error: ${errorText}`);
      throw new Error(`Agent backend responded with status: ${agentResponse.status}`);
    }

    const data = await agentResponse.json();

    // ✅ Persist SSL scan results to MongoDB
    if (assetId) {
      try {
        const client = await clientPromise;
        const db = client.db("cyb_dashboard");
        await db.collection("ssl_scans").updateOne(
          { assetId },
          {
            $set: {
              assetId,
              domain,
              sslData: data,
              scannedAt: new Date()
            }
          },
          { upsert: true }
        );
        console.log(`>>> SSL scan saved for assetId: ${assetId}`);
      } catch (dbErr) {
        console.error("Failed to save SSL data to DB:", dbErr);
        // Non-fatal — still return the data to the client
      }
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("SSL Scan proxy error:", error);
    return NextResponse.json(
      { error: "Failed to execute SSL scan on backend" },
      { status: 500 }
    );
  }
}
