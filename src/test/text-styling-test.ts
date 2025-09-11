import { formatAIResponse, FormatOptions } from '../lib/ai-formatter';

// Test text with various styling
const testText = `Here's a test of styling:

**Bold text** and regular text.
*Italic text* and more regular text.
\`Code text\` and normal text.

Mixed: **Bold** with *italic* and \`code\` together.

**Bold with *italic inside*** and regular text.`;

// Test function
function testTextStyling() {
  console.log('=== TEXT STYLING TESTS ===\n');

  // Test 1: All enabled (default)
  console.log('1. Markdown - All styling enabled:');
  const options1: FormatOptions = {
    format: 'markdown',
    enableBold: true,
    enableItalic: true,
    enableInlineCode: true
  };
  console.log(formatAIResponse(testText, options1));
  console.log('\n---\n');

  // Test 2: Bold disabled
  console.log('2. Markdown - Bold disabled:');
  const options2: FormatOptions = {
    format: 'markdown',
    enableBold: false,
    enableItalic: true,
    enableInlineCode: true
  };
  console.log(formatAIResponse(testText, options2));
  console.log('\n---\n');

  // Test 3: Italic disabled
  console.log('3. Markdown - Italic disabled:');
  const options3: FormatOptions = {
    format: 'markdown',
    enableBold: true,
    enableItalic: false,
    enableInlineCode: true
  };
  console.log(formatAIResponse(testText, options3));
  console.log('\n---\n');

  // Test 4: Code disabled
  console.log('4. Markdown - Code disabled:');
  const options4: FormatOptions = {
    format: 'markdown',
    enableBold: true,
    enableItalic: true,
    enableInlineCode: false
  };
  console.log(formatAIResponse(testText, options4));
  console.log('\n---\n');

  // Test 5: HTML format with all enabled
  console.log('5. HTML - All styling enabled:');
  const options5: FormatOptions = {
    format: 'html',
    enableBold: true,
    enableItalic: true,
    enableInlineCode: true
  };
  console.log(formatAIResponse(testText, options5));
  console.log('\n---\n');

  // Test 6: HTML format with bold disabled
  console.log('6. HTML - Bold disabled:');
  const options6: FormatOptions = {
    format: 'html',
    enableBold: false,
    enableItalic: true,
    enableInlineCode: true
  };
  console.log(formatAIResponse(testText, options6));
  console.log('\n---\n');

  // Test 7: All styling disabled
  console.log('7. Markdown - All styling disabled:');
  const options7: FormatOptions = {
    format: 'markdown',
    enableBold: false,
    enableItalic: false,
    enableInlineCode: false
  };
  console.log(formatAIResponse(testText, options7));
  console.log('\n---\n');

  console.log('=== END TESTS ===');
}

// Export for use in other files
export { testTextStyling };

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testTextStyling();
}
