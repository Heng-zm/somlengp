"use client";

import React from 'react';
import { AIResponseFormatter } from '@/components/features/ai/AIResponseFormatter';

export default function AIResponseDemo() {
  // Sample AI response text with different styling
  const sampleResponse = `Here's a description of the image:

The image is a cartoon drawing of a cute, simple character.

Here's a breakdown of its features:

**Shape:** The main body is a rounded, almost blob-like shape, white in color, with a smooth outline.

**Face:** The face is simplistic, featuring two small, dark dots for eyes and a small, curved line for a mouth, suggesting a happy expression. There are two light pink blush marks on the cheeks.

**Arms/hands:** Two short, stubby arms extend downward, ending in hands that are formed into a heart shape.

**Style:** The overall style is minimalist and childlike, using basic shapes and soft colors. The lines are slightly uneven, giving it a hand-drawn feel.

The character conveys a feeling of \`warmth\`, *friendliness*, and **innocence**.`;

  const [formattedOutput, setFormattedOutput] = React.useState<string>('');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">AI Response Formatter Demo</h1>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Sample Input Text:</h2>
        <pre className="text-sm bg-white dark:bg-gray-800 p-3 rounded border whitespace-pre-wrap">
          {sampleResponse}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">AI Response Formatter:</h2>
        <AIResponseFormatter 
          value={sampleResponse} 
          onFormatted={setFormattedOutput}
        />
      </div>

      {formattedOutput && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Formatted Output:</h2>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
            <pre className="text-sm whitespace-pre-wrap">{formattedOutput}</pre>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Usage Instructions:</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Select <strong>Markdown</strong> or <strong>HTML</strong> format to enable text styling options</li>
          <li>Use <code>**bold text**</code> for <strong>bold formatting</strong></li>
          <li>Use <code>*italic text*</code> for <em>italic formatting</em></li>
          <li>Use <code>`code text`</code> for <code>inline code formatting</code></li>
          <li>Toggle the styling checkboxes to enable/disable specific formatting</li>
          <li>Export the formatted text using the Export button</li>
        </ul>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Format Options:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Plain text:</strong> No formatting, raw text output
          </div>
          <div>
            <strong>Markdown:</strong> Markdown syntax with optional text styling
          </div>
          <div>
            <strong>HTML:</strong> HTML format with styled elements
          </div>
          <div>
            <strong>JSON:</strong> JSON format for structured data
          </div>
          <div>
            <strong>Code block:</strong> Wrapped in code fences with language syntax
          </div>
        </div>
      </div>
    </div>
  );
}
