// Example usage of shareable route generation functions

import { 
  generateShareableRoute, 
  parseShareableRoute, 
  generateShareableRouteBatch 
} from '../id-utils';

// Example 1: Generate a simple shareable route
console.log('=== Example 1: Simple Route Generation ===');
const simpleRoute = generateShareableRoute('/ai-assistant');
console.log('Generated route:', simpleRoute.route);
console.log('Route ID:', simpleRoute.id);
// Output: /ai-assistant/=AE3TifNagMlXtBHunG4l61gIqPLa

// Example 2: Generate route with custom options
console.log('\n=== Example 2: Custom Options ===');
const customRoute = generateShareableRoute('/profile', {
  idLength: 20,
  prefix: 'usr',
  includeTimestamp: false
});
console.log('Custom route:', customRoute.route);
console.log('Custom ID:', customRoute.id);

// Example 3: Generate route with timestamp
console.log('\n=== Example 3: With Timestamp ===');
const timestampedRoute = generateShareableRoute('/dashboard', {
  includeTimestamp: true,
  idLength: 24
});
console.log('Timestamped route:', timestampedRoute.route);
console.log('Timestamped ID:', timestampedRoute.id);

// Example 4: Parse a shareable route
console.log('\n=== Example 4: Parse Shareable Route ===');
const parsed = parseShareableRoute('/ai-assistant/=AE3TifNagMlXtBHunG4l61gIqPLa');
console.log('Base path:', parsed.basePath);
console.log('ID:', parsed.id);
console.log('Is valid:', parsed.isValid);

// Example 5: Generate multiple routes in batch
console.log('\n=== Example 5: Batch Generation ===');
const batchRoutes = generateShareableRouteBatch('/document', 5, {
  idLength: 16
});
batchRoutes.forEach((item, index) => {
  console.log(`Route ${index + 1}:`, item.route);
});

// Example 6: Real-world usage in a Next.js component
export function ShareButton({ basePath }: { basePath: string }) {
  const handleShare = () => {
    const { route, id } = generateShareableRoute(basePath);
    const fullUrl = `${window.location.origin}${route}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(fullUrl);
    console.log('Shareable link copied:', fullUrl);
    
    // Or open share dialog
    if (navigator.share) {
      navigator.share({
        title: 'Share this page',
        url: fullUrl
      });
    }
  };
  
  return null; // Component implementation
}

// Example 7: Dynamic route handler (Next.js)
export async function handleShareableRoute(pathname: string) {
  const parsed = parseShareableRoute(pathname);
  
  if (parsed.isValid && parsed.id) {
    console.log('Valid shareable route detected');
    console.log('Base:', parsed.basePath);
    console.log('ID:', parsed.id);
    
    // Fetch data using the ID
    // const data = await fetchSharedData(parsed.id);
    return {
      basePath: parsed.basePath,
      id: parsed.id,
      // data
    };
  }
  
  return null;
}
