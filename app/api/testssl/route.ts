import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

export const maxDuration = 300; // Increased for deep SSL scans

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    console.log(`>>> PROXYING TESTSSL SCAN FOR: [${domain}]`);

    // Proxy the request to the agent backend as per the curl specification
    const agentResponse = await fetch("http://localhost:8000/api/testssl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        host: domain, // The backend expects 'host' instead of 'domain'
        port: 443     // Defaulting to 443
      })
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error(`Backend Error: ${errorText}`);
      throw new Error(`Agent backend responded with status: ${agentResponse.status}`);
    }

    const data = await agentResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("SSL Scan proxy error:", error);
    return NextResponse.json(
      { error: "Failed to execute SSL scan on backend" },
      { status: 500 }
    );
  }
}
