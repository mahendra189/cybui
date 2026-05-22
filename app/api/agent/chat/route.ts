import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, threadId } = await request.json();

    // 1. Fetch live database context from MongoDB
    let dbContextText = "";
    try {
      const client = await clientPromise;
      const db = client.db("inids_dashboard");

      const [targets, assets, ports, services] = await Promise.all([
        db.collection("targets").find({}).toArray(),
        db.collection("assets").find({}).toArray(),
        db.collection("ports").find({}).toArray(),
        db.collection("services").find({}).toArray(),
      ]);

      dbContextText += "### SYSTEM DATABASE CONTEXT (LIVE TELEMETRY)\n";
      dbContextText += `Total Targets: ${targets.length}\n`;
      dbContextText += `Total Discovered Assets: ${assets.length}\n`;
      dbContextText += `Total Open Ports: ${ports.length}\n`;
      dbContextText += `Total Running Services: ${services.length}\n\n`;

      if (targets.length > 0) {
        dbContextText += "#### Devices & Targets:\n";
        targets.forEach((t: any) => {
          dbContextText += `- IP: ${t.ip || 'N/A'}, Hostname: ${t.hostname || 'N/A'}, MAC: ${t.mac || 'N/A'}, Status: ${t.alive ? 'Online' : 'Offline'}, Latency: ${t.latency_ms || 0}ms\n`;
        });
        dbContextText += "\n";
      }

      if (assets.length > 0) {
        dbContextText += "#### Assets/Hosts Info:\n";
        assets.forEach((a: any) => {
          dbContextText += `- ${a.name || 'Asset'} (IP: ${a.internalIp || a.externalIp || 'N/A'}, OS: ${a.os || 'Unknown'}, Type: ${a.type || 'Host'}, Score: ${a.overallScore || 100})\n`;
          if (a.vulnerabilities && a.vulnerabilities.length > 0) {
            a.vulnerabilities.forEach((v: any) => {
              dbContextText += `  * Vulnerability: [${v.severity || 'Medium'}] ${v.id || v.title} - ${v.title || ''} (CVSS: ${v.cvss || 'N/A'})\n`;
            });
          }
        });
        dbContextText += "\n";
      }

      if (ports.length > 0) {
        dbContextText += "#### Open Ports & Services mapped to devices:\n";
        ports.forEach((p: any) => {
          dbContextText += `- Target IP: ${p.targetIP || 'N/A'}, Port: ${p.port || p.portNumber}/${p.protocol}, Service: ${p.service || 'N/A'}, State: ${p.state || 'open'}\n`;
        });
        dbContextText += "\n";
      }

      if (services.length > 0) {
        dbContextText += "#### Detected Services:\n";
        services.forEach((s: any) => {
          dbContextText += `- Service Name: ${s.name}, Version: ${s.version || 'Detected'}, Risk: ${s.riskScore || 'Low'}, Port: ${s.port || 'N/A'}\n`;
        });
        dbContextText += "\n";
      }

    } catch (dbError) {
      console.error("Failed to query MongoDB context for agent:", dbError);
      // Continue without DB context if MongoDB fails
      dbContextText = "System Context: Unable to fetch live database context due to a database connection issue.\n\n";
    }

    // Assemble the prompt sent to the LangGraph agent
    const enrichedPrompt = `You are a security agent with this [CONTEXT] also check if there's any vulnerability which you can conclude by this data if any let the user know about it
${dbContextText} and
[END CONTEXT]

User Request: ${prompt}`;

    console.log(`>>> PROXYING ENRICHED CHAT PROMPT TO LOCALHOST:8000/api/chat (Thread: ${threadId || 'new'})`);

    // Proxy to the Python LangGraph backend endpoint
    const agentResponse = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: enrichedPrompt,
        thread_id: threadId || undefined
      })
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      throw new Error(`Agent backend responded with status: ${agentResponse.status} - ${errorText}`);
    }

    const data = await agentResponse.json();
    console.log(data.response)
    console.log(prompt)

    // Return the response and the thread_id
    return NextResponse.json({
      response: data.response || "The agent did not return a valid response.",
      threadId: data.thread_id
    });

  } catch (error: any) {
    console.error("Agent chat execution failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process intelligence query" },
      { status: 500 }
    );
  }
}
