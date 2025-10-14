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
  // Test 1: All enabled (default)
  const options1: FormatOptions = {
    format: 'markdown',
    enableBold: true,
    enableItalic: true,
    enableInlineCode: true
  };
  :', formatAIResponse(testText, options1));
  // Test 2: Bold disabled
  const options2: FormatOptions = {
    format: 'markdown',
    enableBold: false,
    enableItalic: true,
    enableInlineCode: true
  };
  :', formatAIResponse(testText, options2));
  // Test 3: Italic disabled
  const options3: FormatOptions = {
    format: 'markdown',
    enableBold: true,
    enableItalic: false,
    enableInlineCode: true
  };
  :', formatAIResponse(testText, options3));
  // Test 4: Code disabled
  const options4: FormatOptions = {
    format: 'markdown',
    enableBold: true,
    enableItalic: true,
    enableInlineCode: false
  };
  :', formatAIResponse(testText, options4));
  // Test 5: HTML format with all enabled
  const options5: FormatOptions = {
    format: 'html',
    enableBold: true,
    enableItalic: true,
    enableInlineCode: true
  };
  :', formatAIResponse(testText, options5));
  // Test 6: HTML format with bold disabled
  const options6: FormatOptions = {
    format: 'html',
    enableBold: false,
    enableItalic: true,
    enableInlineCode: true
  };
  :', formatAIResponse(testText, options6));
  // Test 7: All styling disabled
  const options7: FormatOptions = {
    format: 'markdown',
    enableBold: false,
    enableItalic: false,
    enableInlineCode: false
  };
  :', formatAIResponse(testText, options7));
}
// Export for use in other files
export { testTextStyling };
// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testTextStyling();
}
