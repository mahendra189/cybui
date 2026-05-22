async function checkOllama() {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    if (res.ok) {
      const data = await res.json();
      console.log("Ollama models installed:", data);
    } else {
      console.log("Ollama on 11434 returned status:", res.status);
    }
  } catch (err) {
    console.error("Could not reach Ollama on 11434 directly:", err.message);
  }

  // Also query http://localhost:8000/ to see if there's any info
  try {
    const res = await fetch('http://127.0.0.1:8000/');
    if (res.ok) {
      const text = await res.text();
      console.log("Port 8000 root response:", text);
    }
  } catch (err) {
    console.error("Could not reach Port 8000 root:", err.message);
  }
}

checkOllama();
