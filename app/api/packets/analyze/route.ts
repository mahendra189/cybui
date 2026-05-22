import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packet = await request.json();

    console.log(">>> [AI Threat Guard] Proxying packet to FastAPI analyze endpoint...");
    
    const backendResponse = await fetch('http://127.0.0.1:8000/api/packets/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packet)
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`FastAPI backend responded with status: ${backendResponse.status} - ${errorText}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Packet threat analysis proxy failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze packet" },
      { status: 500 }
    );
  }
}
