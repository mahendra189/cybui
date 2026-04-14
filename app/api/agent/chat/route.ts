import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, targetId, context } = await request.json();

    console.log(`>>> ENGAGING AI CHAT FOR TARGET: [${targetId}]`);

    // Proxy to your backend's intelligence analysis endpoint
    // This allows the AI to answer questions based on the discoveries
    const agentResponse = await fetch("http://127.0.0.1:8000/api/ollama/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        target_id: targetId,
        context: context // Passing the full list of assets, ports, and services
      })
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent backend responded with status: ${agentResponse.status}`);
    }

    const data = await agentResponse.json();

    // Return the AI's response to the frontend
    return NextResponse.json({
      response: data.response || data.text || "I've analyzed the current discovery data, but couldn't formulate a specific response."
    });

  } catch (error: any) {
    console.error("Agent chat execution failed:", error);
    return NextResponse.json(
      { error: "Failed to process intelligence query" },
      { status: 500 }
    );
  }
}
