#!/usr/bin/env node

/**
 * Simple test script for the web MCP server endpoints
 * Run this after starting the development server
 */

async function testEndpoint(url, options = {}) {
  try {
    console.log(`Testing ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---');
    return data;
  } catch (error) {
    console.error(`Error testing ${url}:`, error.message);
    console.log('---');
    return null;
  }
}

async function runTests() {
  const baseUrl = 'http://localhost:4321'; // Default Astro dev server port
  
  console.log('🧪 Testing Web MCP Server Endpoints\n');
  
  // Test 1: Server Information
  console.log('1. Server Information');
  await testEndpoint(`${baseUrl}/api/mcp`);
  
  // Test 2: List Tools
  console.log('2. List Tools');
  const tools = await testEndpoint(`${baseUrl}/api/mcp/tools`);
  
  // Test 3: Execute a search tool
  console.log('3. Execute Search Tool (MCP)');
  await testEndpoint(`${baseUrl}/api/mcp/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'prompt_search',
        arguments: { query: 'code', limit: 3 }
      }
    })
  });
  
  // Test 4: List categories tool
  console.log('4. List Categories Tool (MCP)');
  await testEndpoint(`${baseUrl}/api/mcp/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'prompt_list_categories',
        arguments: {}
      }
    })
  });
  
  // Test 5: REST API render (if we can find a prompt ID)
  if (tools && tools.result && tools.result.tools && tools.result.tools.length > 0) {
    const promptTool = tools.result.tools.find(t => t.name.startsWith('prompt_') && !t.name.includes('search') && !t.name.includes('categories'));
    if (promptTool) {
      const promptId = promptTool.name.replace('prompt_', '');
      console.log(`5. REST API Render (promptId: ${promptId})`);
      await testEndpoint(`${baseUrl}/api/mcp/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: promptId,
          variables: {}
        })
      });
    } else {
      console.log('5. REST API Render - Skipped (no prompt tools found)');
      console.log('---');
    }
  } else {
    console.log('5. REST API Render - Skipped (could not get tools list)');
    console.log('---');
  }
  
  console.log('✅ Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Start the development server: npm run dev:mcp-web');
  console.log('2. Run this test: node test-mcp-web.js');
  console.log('3. Check the MCP_WEB_SERVER.md for usage examples');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with fetch support');
  console.log('💡 Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);