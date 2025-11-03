'use client';

import { useState } from 'react';
import { 
  generateShareableRoute, 
  isSessionExpired, 
  getSessionAge, 
  getSessionTimeRemaining,
  formatTimeRemaining,
  extractTimestampFromId 
} from '@/lib/id-utils';
import { Button } from '@/components/ui/button';

export default function TestExpirationPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = () => {
    setTestResults([]);

    // Test 1: Generate route with timestamp
    const { route, id } = generateShareableRoute('/ai-assistant', {
      prefix: 'chat',
      includeTimestamp: true
    });
    addResult(`✅ Generated route: ${route}`);
    addResult(`   ID: ${id}`);

    // Test 2: Extract timestamp
    const timestamp = extractTimestampFromId(id);
    if (timestamp) {
      addResult(`✅ Extracted timestamp: ${new Date(timestamp).toISOString()}`);
    } else {
      addResult(`❌ Failed to extract timestamp`);
    }

    // Test 3: Check expiration (should not be expired)
    const expired = isSessionExpired(id, 30 * 24 * 60 * 60 * 1000);
    addResult(`✅ Is expired (30 days): ${expired ? 'Yes' : 'No'}`);

    // Test 4: Get session age
    const age = getSessionAge(id);
    addResult(`✅ Session age: ${age}`);

    // Test 5: Get time remaining
    const remaining = getSessionTimeRemaining(id, 30 * 24 * 60 * 60 * 1000);
    if (remaining !== null) {
      addResult(`✅ Time remaining: ${formatTimeRemaining(remaining)}`);
    }

    // Test 6: Simulate old session (1 hour old)
    const oldTimestamp = Date.now() - (1 * 60 * 60 * 1000);
    const oldId = `chat${oldTimestamp.toString(36)}_ABC123`;
    const oldAge = getSessionAge(oldId);
    addResult(`\n✅ Simulated 1-hour-old session:`);
    addResult(`   ID: ${oldId}`);
    addResult(`   Age: ${oldAge}`);
    addResult(`   Expired: ${isSessionExpired(oldId, 30 * 24 * 60 * 60 * 1000) ? 'Yes' : 'No'}`);

    // Test 7: Simulate very old session (35 days old)
    const veryOldTimestamp = Date.now() - (35 * 24 * 60 * 60 * 1000);
    const veryOldId = `chat${veryOldTimestamp.toString(36)}_XYZ789`;
    const veryOldAge = getSessionAge(veryOldId);
    addResult(`\n✅ Simulated 35-day-old session:`);
    addResult(`   ID: ${veryOldId}`);
    addResult(`   Age: ${veryOldAge}`);
    addResult(`   Expired: ${isSessionExpired(veryOldId, 30 * 24 * 60 * 60 * 1000) ? 'Yes ⚠️' : 'No'}`);

    // Test 8: Test different expiration thresholds
    addResult(`\n✅ Expiration with different thresholds:`);
    const testId = `chat${(Date.now() - 15 * 24 * 60 * 60 * 1000).toString(36)}_TEST`;
    addResult(`   15-day-old session:`);
    addResult(`     - 7-day threshold: ${isSessionExpired(testId, 7 * 24 * 60 * 60 * 1000) ? 'Expired' : 'Valid'}`);
    addResult(`     - 30-day threshold: ${isSessionExpired(testId, 30 * 24 * 60 * 60 * 1000) ? 'Expired' : 'Valid'}`);
    addResult(`     - 90-day threshold: ${isSessionExpired(testId, 90 * 24 * 60 * 60 * 1000) ? 'Expired' : 'Valid'}`);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Test Session Auto-Expiration
        </h1>

        <Button
          onClick={runTests}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Run Expiration Tests
        </Button>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                {result}
              </pre>
            </div>
          ))}
        </div>

        {testResults.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Click "Run Expiration Tests" to test the auto-expiration functionality
          </div>
        )}

        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold mb-3 text-green-900 dark:text-green-100">
            ✅ Features Added:
          </h2>
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
            <li>• <strong>Timestamp-based IDs:</strong> Routes include creation time</li>
            <li>• <strong>Expiration checking:</strong> Automatically detect old sessions</li>
            <li>• <strong>Human-readable age:</strong> "2 hours ago", "3 days ago"</li>
            <li>• <strong>Time remaining:</strong> Calculate until expiration</li>
            <li>• <strong>Auto-cleanup:</strong> Remove expired sessions from localStorage</li>
            <li>• <strong>Visual warnings:</strong> Yellow banner for expired sessions</li>
            <li>• <strong>Configurable expiry:</strong> Default 30 days (customizable)</li>
          </ul>
        </div>

        <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-100">
            📋 New Functions Available:
          </h2>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200 font-mono">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              extractTimestampFromId(id) → number | null
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              isSessionExpired(id, maxAgeMs) → boolean
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              getSessionAge(id) → string
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              getSessionTimeRemaining(id, maxAgeMs) → number | null
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              formatTimeRemaining(ms) → string
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              cleanupExpiredSessions(prefix, maxAgeMs) → number
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-semibold mb-3 text-purple-900 dark:text-purple-100">
            🚀 Usage in AI Assistant:
          </h2>
          <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <p>• Sessions now include timestamps in the URL</p>
            <p>• Expired sessions show a yellow warning banner</p>
            <p>• Session age is displayed subtly below header</p>
            <p>• Auto-cleanup runs on page load (removes 30+ day old data)</p>
            <p>• "Start New" button for expired sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
