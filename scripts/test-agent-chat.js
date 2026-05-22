async function testAgentChat() {
  try {
    console.log("Sending chat request to /api/chat...");
    const res = await fetch('http://127.0.0.1:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: "Hello"
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Agent response:", data);
    } else {
      console.log("Agent chat returned status:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Error communicating with agent chat:", err);
  }
}

testAgentChat();
