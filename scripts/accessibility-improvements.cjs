#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('♿ Improving accessibility across the application...');

function findFiles(dir, extensions = ['.tsx', '.jsx']) {
  const files = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        if (!item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function improveAccessibility(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const fileName = path.basename(filePath);
    
    // 1. Add missing alt attributes to images
    const imgWithoutAlt = content.match(/<img[^>]*(?!alt=)[^>]*>/g);
    if (imgWithoutAlt) {
      content = content.replace(/<img([^>]*)>/g, (match, attributes) => {
        if (!attributes.includes('alt=')) {
          console.log(`🖼️  Added alt attribute to image in ${fileName}`);
          hasChanges = true;
          return `<img${attributes} alt="">`;
        }
        return match;
      });
    }
    
    // 2. Add ARIA labels to buttons without text content
    const buttonsWithoutText = content.match(/<button[^>]*>[\s\n]*<[^>]+\/?>[\s\n]*<\/button>/g);
    if (buttonsWithoutText) {
      content = content.replace(
        /<button([^>]*)>([\s\n]*<[^>]+\/?>[\s\n]*)<\/button>/g,
        (match, attributes, innerContent) => {
          if (!attributes.includes('aria-label') && !attributes.includes('title')) {
            console.log(`🔘 Added aria-label to button in ${fileName}`);
            hasChanges = true;
            return `<button${attributes} aria-label="Action button">${innerContent}</button>`;
          }
          return match;
        }
      );
    }
    
    // 3. Add role attributes to interactive elements
    const interactiveElements = content.match(/<div[^>]*onClick[^>]*>/g);
    if (interactiveElements) {
      content = content.replace(
        /<div([^>]*)onClick([^>]*)>/g,
        (match, before, after) => {
          if (!before.includes('role=') && !after.includes('role=')) {
            console.log(`👆 Added role="button" to interactive div in ${fileName}`);
            hasChanges = true;
            return `<div${before} role="button" tabIndex={0}${after}>`;
          }
          return match;
        }
      );
    }
    
    // 4. Add proper heading structure
    const headings = content.match(/<h[1-6][^>]*>/g);
    if (headings) {
      let currentLevel = 1;
      const headingLevels = headings.map(h => parseInt(h.charAt(2)));
      
      if (headingLevels.length > 1) {
        for (let i = 1; i < headingLevels.length; i++) {
          const prev = headingLevels[i - 1];
          const curr = headingLevels[i];
          if (curr > prev + 1) {
            console.log(`⚠️  Heading structure issue in ${fileName}: h${prev} followed by h${curr}`);
          }
        }
      }
    }
    
    // 5. Add aria-describedby for form fields with help text
    const formFieldsWithHelp = content.match(/<input[^>]*>[\s\S]*?<[^>]*>(help|hint|description)/gi);
    if (formFieldsWithHelp) {
      console.log(`📝 Form field with help text found in ${fileName} - consider adding aria-describedby`);
    }
    
    // 6. Check for proper focus management
    if (content.includes('autoFocus') && !content.includes('aria-live')) {
      console.log(`🔍 AutoFocus detected in ${fileName} - consider aria-live for screen readers`);
    }
    
    // 7. Add semantic HTML suggestions
    if (content.includes('<div className="header"') || content.includes('<div className="nav"')) {
      console.log(`🏗️  Consider using semantic HTML elements in ${fileName} (header, nav, main, section, article)`);
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Create an accessibility testing utility
const accessibilityTest = `
// Accessibility Testing Utility
import { useEffect } from 'react';

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  suggestion?: string;
}

export function useAccessibilityChecker(enabled = process.env.NODE_ENV === 'development') {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const issues: AccessibilityIssue[] = [];

    // Check for missing alt attributes
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        issues.push({
          type: 'error',
          message: \`Image missing alt attribute\`,
          element: \`img[\${index}]\`,
          suggestion: 'Add descriptive alt text or alt="" for decorative images'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (index === 0 && level !== 1) {
        issues.push({
          type: 'warning',
          message: \`First heading should be h1, found \${heading.tagName.toLowerCase()}\`,
          element: heading.tagName.toLowerCase(),
          suggestion: 'Start with h1 for proper document outline'
        });
      } else if (level > lastLevel + 1) {
        issues.push({
          type: 'warning',
          message: \`Heading level skipped: \${lastLevel} to \${level}\`,
          element: heading.tagName.toLowerCase(),
          suggestion: 'Use consecutive heading levels for better structure'
        });
      }
      lastLevel = level;
    });

    // Check for interactive elements without proper roles
    const interactiveElements = document.querySelectorAll('[onclick], [onkeydown]');
    interactiveElements.forEach((element, index) => {
      if (!element.getAttribute('role') && 
          !['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        issues.push({
          type: 'error',
          message: \`Interactive element missing role attribute\`,
          element: \`\${element.tagName.toLowerCase()}[\${index}]\`,
          suggestion: 'Add role="button" or appropriate ARIA role'
        });
      }

      if (!element.hasAttribute('tabindex') && 
          !['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        issues.push({
          type: 'warning',
          message: \`Interactive element not keyboard accessible\`,
          element: \`\${element.tagName.toLowerCase()}[\${index}]\`,
          suggestion: 'Add tabindex="0" for keyboard navigation'
        });
      }
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!ariaLabel && !ariaLabelledby && (!id || !document.querySelector(\`label[for="\${id}"]\`))) {
        issues.push({
          type: 'error',
          message: \`Form control missing accessible label\`,
          element: \`\${input.tagName.toLowerCase()}[\${index}]\`,
          suggestion: 'Add aria-label, aria-labelledby, or associate with a label element'
        });
      }
    });

    // Report issues
    if (issues.length > 0) {
      console.group('🔍 Accessibility Issues Found');
      issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(\`\${icon} \${issue.message}\`);
        if (issue.element) console.log(\`   Element: \${issue.element}\`);
        if (issue.suggestion) console.log(\`   💡 \${issue.suggestion}\`);
      });
      console.groupEnd();
    } else {
      console.log('✅ No accessibility issues found');
    }
  }, [enabled]);
}

// Keyboard navigation helper
export function useKeyboardNavigation(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableArray.length;
          focusableArray[nextIndex]?.focus();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
          focusableArray[prevIndex]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          focusableArray[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          focusableArray[focusableArray.length - 1]?.focus();
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);
}
`;

// Write the accessibility utility
const utilsDir = path.join(__dirname, '../src/hooks');
const accessibilityHookPath = path.join(utilsDir, 'use-accessibility.ts');

if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

fs.writeFileSync(accessibilityHookPath, accessibilityTest);
console.log('✅ Created accessibility testing hook at hooks/use-accessibility.ts');

// Run accessibility improvements
const srcDir = path.join(__dirname, '../src');
const files = findFiles(srcDir);
let improvedCount = 0;

console.log(`📁 Analyzing ${files.length} React components for accessibility...`);

files.forEach(file => {
  if (improveAccessibility(file)) {
    improvedCount++;
  }
});

console.log(`
✅ Accessibility improvement complete!
📊 Improved ${improvedCount} out of ${files.length} files

📋 Accessibility Checklist Summary:
1. ✅ Added missing alt attributes to images
2. ✅ Added ARIA labels to buttons without text
3. ✅ Added roles to interactive elements
4. ✅ Checked heading structure
5. ✅ Identified form accessibility issues
6. ✅ Created accessibility testing hooks

Next Steps:
1. Use the useAccessibilityChecker hook in development
2. Review heading structure warnings
3. Add proper labels to form controls
4. Consider semantic HTML elements
5. Test with screen readers
6. Implement keyboard navigation patterns

Example usage:
\`\`\`tsx
import { useAccessibilityChecker, useKeyboardNavigation } from '@/hooks/use-accessibility';

function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useAccessibilityChecker(); // Automatically checks in development
  useKeyboardNavigation(containerRef); // Enables keyboard navigation

  return <div ref={containerRef}>...</div>;
}
\`\`\`
`);