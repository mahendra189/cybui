async function testLlm() {
  const samplePacket = {
    timestamp: "12:00:01.000",
    protocol: "TCP",
    source: "192.168.1.50:49210",
    destination: "192.168.1.1:80",
    length: 120,
    info: "GET /cgi-bin/php?%-d+allow_url_include%3don+-d+safe_mode%3doff+-d+suhosin.simulation%3don+-d+disable_functions%3d%22%22+-d+open_basedir%3dnone+-d+auto_prepend_file%3dphp://input+-n HTTP/1.1"
  };

  const systemPrompt = `Analyze the following network packet for malicious activity. 
Return your assessment strictly as a JSON object (no markdown formatting, no code block backticks) with the following structure:
{
  "malicious": true,
  "reason": "Explain briefly why the packet is malicious or benign",
  "severity": "high"
}
If the packet is benign, set "malicious" to false and "severity" to "none".

Packet details:
${JSON.stringify(samplePacket, null, 2)}`;

  try {
    console.log("Sending request to /api/ollama/chat...");
    const res = await fetch('http://127.0.0.1:8000/api/ollama/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: systemPrompt
      })
    });

    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      return;
    }

    const data = await res.json();
    console.log("Response received from LLM:");
    console.log(data);
  } catch (err) {
    console.error("Error during fetch:", err);
  }
}

testLlm();
