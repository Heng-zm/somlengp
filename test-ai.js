// Test script for AI Assistant API
const fetch = require('node:fetch');

// Mock Firebase token for testing (you should replace this with a real token in production)
const mockToken = 'test-token-replace-with-real-firebase-token';

async function testAIEndpoint(model, message = 'Hello, how are you?') {
  try {
    console.log(`\n🧪 Testing ${model} model...`);
    
    const response = await fetch('http://localhost:3000/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: message }
        ],
        userId: 'test-user',
        model: model,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${model} - Success:`, data.response?.substring(0, 100) + '...');
    } else {
      console.log(`❌ ${model} - Error:`, data.error);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log(`💥 ${model} - Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testAllModels() {
  console.log('🚀 Starting AI Assistant API Tests...\n');
  
  // Test GET endpoint first
  try {
    const getResponse = await fetch('http://localhost:3000/api/ai-assistant');
    const getData = await getResponse.json();
    console.log('📡 GET endpoint:', getData);
  } catch (error) {
    console.log('❌ GET endpoint error:', error.message);
  }

  // Test all models
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp', 
    'grok-beta',
    'grok-vision-beta'
  ];

  for (const model of models) {
    await testAIEndpoint(model);
  }
  
  console.log('\n✨ Test completed!');
}

// Run tests
testAllModels();
