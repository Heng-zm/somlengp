module.exports = {
  ci: {
    collect: {
      // URLs to test - adjust these to match your deployed URLs or local server
      url: [
        'http://localhost:3000',
        'http://localhost:3000/home',
        'http://localhost:3000/ai-assistant',
        'http://localhost:3000/privacy'
      ],
      // Start your Next.js server before running Lighthouse
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready - started server on',
      startServerReadyTimeout: 30000,
      // Number of runs for each URL
      numberOfRuns: 3,
      // Chrome settings optimized for CI environment
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage --no-first-run --disable-extensions --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding',
        // Throttling settings for consistent results
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        // Wait for page to be fully loaded
        waitUntil: ['load', 'networkidle0']
      }
    },
    assert: {
      // Use lighthouse:no-pwa preset as base (since this appears to be a web app, not PWA)
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Core Web Vitals thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }], // 4 seconds
        'first-input-delay': ['error', { maxNumericValue: 300 }], // 300ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.25 }], // 0.25
        'speed-index': ['warn', { maxNumericValue: 4000 }], // 4 seconds
        
        // Performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2 seconds
        'interactive': ['warn', { maxNumericValue: 5000 }], // 5 seconds
        'total-blocking-time': ['warn', { maxNumericValue: 600 }], // 600ms
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 40000 }], // 40KB
        'unused-css-rules': ['warn', { maxNumericValue: 40000 }], // 40KB
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }], // 500ms
        
        // Accessibility (based on your existing accessibility features)
        'color-contrast': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'image-alt': 'error',
        
        // Best practices
        'uses-https': 'off', // Disable for localhost testing
        'is-on-https': 'off', // Disable for localhost testing
        'viewport': 'error',
        'without-javascript': 'off', // Your app likely requires JS
        
        // SEO basics
        'document-title': 'error',
        'meta-description': 'warn',
        'hreflang': 'off', // Disable if not using multiple languages
        
        // Custom thresholds based on your performance monitoring setup
        'bootup-time': ['warn', { maxNumericValue: 4000 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }]
      }
    },
    upload: {
      // Store results temporarily for CI analysis
      target: 'temporary-public-storage'
    },
    // Server configuration for CI environment
    server: {
      port: 3000,
      host: '0.0.0.0'
    }
  }
};
