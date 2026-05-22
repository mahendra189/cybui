async function main() {
  try {
    const res = await fetch('http://127.0.0.1:8000/openapi.json');
    if (!res.ok) {
      console.error('Failed to fetch openapi.json:', res.statusText);
      return;
    }
    const data = await res.json();
    console.log('ChatRequest Schema:');
    console.log(JSON.stringify(data.components.schemas['ChatRequest'], null, 2));
    console.log('\nChatResponse Schema:');
    console.log(JSON.stringify(data.components.schemas['ChatResponse'], null, 2));
  } catch (err) {
    console.error('Error fetching OpenAPI schema:', err);
  }
}

main();
