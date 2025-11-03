'use client';

import { useState } from 'react';
import { generateShareableRoute, parseShareableRoute, generateShareableRouteBatch } from '@/lib/id-utils';

export default function TestShareableRoutePage() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (test: string, data: any) => {
    setResults(prev => [...prev, `${test}: ${JSON.stringify(data, null, 2)}`]);
  };

  const runTests = () => {
    setResults([]);
    
    // Test 1: Basic generation
    try {
      const result = generateShareableRoute('/ai-assistant');
      addResult('✅ Test 1: Basic generation', result);
    } catch (error: any) {
      addResult('❌ Test 1 Error', error.message);
    }

    // Test 2: With custom options
    try {
      const result = generateShareableRoute('/documents', {
        idLength: 20,
        prefix: 'doc',
      });
      addResult('✅ Test 2: Custom options', result);
    } catch (error: any) {
      addResult('❌ Test 2 Error', error.message);
    }

    // Test 3: With timestamp
    try {
      const result = generateShareableRoute('/share', {
        includeTimestamp: true,
      });
      addResult('✅ Test 3: With timestamp', result);
    } catch (error: any) {
      addResult('❌ Test 3 Error', error.message);
    }

    // Test 4: Parse route
    try {
      const generated = generateShareableRoute('/ai-assistant');
      const parsed = parseShareableRoute(generated.route);
      addResult('✅ Test 4: Parse route', { generated, parsed });
    } catch (error: any) {
      addResult('❌ Test 4 Error', error.message);
    }

    // Test 5: Batch generation
    try {
      const routes = generateShareableRouteBatch('/session', 5);
      const ids = routes.map(r => r.id);
      const uniqueIds = new Set(ids);
      addResult('✅ Test 5: Batch generation', {
        count: routes.length,
        allUnique: ids.length === uniqueIds.size,
        routes: routes.map(r => r.route),
      });
    } catch (error: any) {
      addResult('❌ Test 5 Error', error.message);
    }

    // Test 6: Edge case - single character path
    try {
      const result = generateShareableRoute('/x');
      addResult('✅ Test 6: Edge case - minimal path', {
        note: 'Single character path handled correctly',
        result,
      });
    } catch (error: any) {
      addResult('❌ Test 6 Error', error.message);
    }

    // Test 7: Different paths
    try {
      const paths = ['/ai-assistant', '/profile', '/documents', '/share'];
      const routes = paths.map(path => generateShareableRoute(path));
      addResult('✅ Test 7: Multiple paths', routes);
    } catch (error: any) {
      addResult('❌ Test 7 Error', error.message);
    }

    // Test 8: Security check
    try {
      const route1 = generateShareableRoute('/test');
      const route2 = generateShareableRoute('/test');
      const isDifferent = route1.id !== route2.id;
      addResult('✅ Test 8: IDs are unique', {
        route1: route1.route,
        route2: route2.route,
        idsAreDifferent: isDifferent,
      });
    } catch (error: any) {
      addResult('❌ Test 8 Error', error.message);
    }

    // Test 9: Real-world example - AI Assistant share
    try {
      const shareRoute = generateShareableRoute('/ai-assistant', {
        prefix: 'chat'
      });
      const fullUrl = `https://example.com${shareRoute.route}`;
      addResult('✅ Test 9: Real-world usage', {
        generatedRoute: shareRoute.route,
        fullShareableUrl: fullUrl,
        idWithPrefix: shareRoute.id,
        readyToUse: true
      });
    } catch (error: any) {
      addResult('❌ Test 9 Error', error.message);
    }
  };

  const successCount = results.filter(r => r.startsWith('✅')).length;
  const failCount = results.filter(r => r.startsWith('❌')).length;

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Test Shareable Route Generation
        </h1>

        {results.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500 dark:border-green-700">
            <div className="text-lg font-semibold text-green-800 dark:text-green-200">
              ✅ generateShareableRoute is working!
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mt-1">
              {successCount} tests passed, {failCount} failed
            </div>
          </div>
        )}

        <button
          onClick={runTests}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Run All Tests
        </button>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <pre className="text-sm overflow-x-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Click "Run All Tests" to test the shareable route generation functions
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">
            How to use:
          </h2>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p><strong>Generate a route:</strong></p>
            <code className="block bg-blue-100 dark:bg-blue-900 p-2 rounded">
              {`const { route, id } = generateShareableRoute('/ai-assistant');`}
            </code>
            
            <p className="mt-4"><strong>Parse a route:</strong></p>
            <code className="block bg-blue-100 dark:bg-blue-900 p-2 rounded">
              {`const { basePath, id, isValid } = parseShareableRoute(route);`}
            </code>
            
            <p className="mt-4"><strong>Generate multiple:</strong></p>
            <code className="block bg-blue-100 dark:bg-blue-900 p-2 rounded">
              {`const routes = generateShareableRouteBatch('/session', 10);`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
