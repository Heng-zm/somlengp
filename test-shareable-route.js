// Test file for generateShareableRoute
// Run with: node test-shareable-route.js

// Import the functions (adjust path as needed)
const { generateShareableRoute, parseShareableRoute, generateShareableRouteBatch } = require('./src/lib/id-utils.ts');

console.log('=== Testing generateShareableRoute ===\n');

// Test 1: Basic generation
console.log('Test 1: Basic route generation');
try {
  const result = generateShareableRoute('/ai-assistant');
  console.log('✅ Result:', result);
  console.log('   Route:', result.route);
  console.log('   ID:', result.id);
  console.log('   ID Length:', result.id.length);
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n---\n');

// Test 2: Custom options
console.log('Test 2: With custom options');
try {
  const result = generateShareableRoute('/documents', {
    idLength: 20,
    prefix: 'doc',
    includeTimestamp: false
  });
  console.log('✅ Result:', result);
  console.log('   Route:', result.route);
  console.log('   ID:', result.id);
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n---\n');

// Test 3: With timestamp
console.log('Test 3: With timestamp included');
try {
  const result = generateShareableRoute('/share', {
    includeTimestamp: true
  });
  console.log('✅ Result:', result);
  console.log('   Route:', result.route);
  console.log('   ID:', result.id);
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n---\n');

// Test 4: Parse route
console.log('Test 4: Parse shareable route');
try {
  const generated = generateShareableRoute('/ai-assistant');
  console.log('Generated route:', generated.route);
  
  const parsed = parseShareableRoute(generated.route);
  console.log('✅ Parsed result:', parsed);
  console.log('   Base Path:', parsed.basePath);
  console.log('   ID:', parsed.id);
  console.log('   Is Valid:', parsed.isValid);
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n---\n');

// Test 5: Batch generation
console.log('Test 5: Batch generation (5 routes)');
try {
  const routes = generateShareableRouteBatch('/session', 5);
  console.log('✅ Generated', routes.length, 'routes');
  routes.forEach((route, i) => {
    console.log(`   ${i + 1}. ${route.route}`);
  });
  
  // Check uniqueness
  const ids = routes.map(r => r.id);
  const uniqueIds = new Set(ids);
  console.log('   All unique?', ids.length === uniqueIds.size ? '✅ Yes' : '❌ No');
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n---\n');

// Test 6: Invalid inputs
console.log('Test 6: Error handling (invalid inputs)');
try {
  const result = generateShareableRoute('');
  console.log('Result:', result);
} catch (error) {
  console.log('✅ Caught error as expected:', error.message);
}

console.log('\n=== Tests Complete ===');
