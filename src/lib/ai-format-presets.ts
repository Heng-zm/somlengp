import { FormatOptions, AIFormat } from './ai-formatter';

export interface FormatPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  options: FormatOptions;
}

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: 'plain',
    name: 'Plain Text',
    description: 'Simple, unformatted text',
    icon: '📄',
    options: { format: 'plain' }
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Structured markdown with headings',
    icon: '📚',
    options: { format: 'markdown', headingLevel: 2 }
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Code blocks with syntax highlighting',
    icon: '👨‍💻',
    options: { format: 'code', language: 'typescript' }
  },
  {
    id: 'json-api',
    name: 'JSON Response',
    description: 'Formatted JSON structure',
    icon: '🔗',
    options: { format: 'json' }
  },
  {
    id: 'html-preview',
    name: 'HTML Preview',
    description: 'Rendered HTML content',
    icon: '🌐',
    options: { format: 'html' }
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Professional report format',
    icon: '📊',
    options: { format: 'markdown', headingLevel: 1, wrapAt: 80 }
  },
  {
    id: 'chat',
    name: 'Chat Response',
    description: 'Conversational format',
    icon: '💬',
    options: { format: 'plain', wrapAt: 60 }
  },
  {
    id: 'email',
    name: 'Email Format',
    description: 'Professional email structure',
    icon: '📧',
    options: { format: 'plain', wrapAt: 72 }
  }
];

export function getPresetById(id: string): FormatPreset | undefined {
  return FORMAT_PRESETS.find(preset => preset.id === id);
}

export function getPresetsByFormat(format: AIFormat): FormatPreset[] {
  return FORMAT_PRESETS.filter(preset => preset.options.format === format);
}

export interface FormatTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'technical' | 'creative' | 'educational';
  template: string;
  variables: string[];
}

export const FORMAT_TEMPLATES: FormatTemplate[] = [
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Structured bug report template',
    category: 'technical',
    template: `# Bug Report

## Summary
{{summary}}

## Steps to Reproduce
{{steps}}

## Expected Behavior
{{expected}}

## Actual Behavior
{{actual}}

## Environment
{{environment}}`,
    variables: ['summary', 'steps', 'expected', 'actual', 'environment']
  },
  {
    id: 'meeting-summary',
    name: 'Meeting Summary',
    description: 'Professional meeting notes template',
    category: 'business',
    template: `# Meeting Summary

**Date:** {{date}}
**Participants:** {{participants}}

## Agenda
{{agenda}}

## Key Decisions
{{decisions}}

## Action Items
{{actions}}

## Next Steps
{{next_steps}}`,
    variables: ['date', 'participants', 'agenda', 'decisions', 'actions', 'next_steps']
  },
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'API endpoint documentation template',
    category: 'technical',
    template: `# {{endpoint_name}}

## Description
{{description}}

## Endpoint
\`\`\`
{{method}} {{url}}
\`\`\`

## Parameters
{{parameters}}

## Response
\`\`\`json
{{response_example}}
\`\`\`

## Error Codes
{{error_codes}}`,
    variables: ['endpoint_name', 'description', 'method', 'url', 'parameters', 'response_example', 'error_codes']
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Business project proposal template',
    category: 'business',
    template: `# Project Proposal: {{project_name}}

## Executive Summary
{{executive_summary}}

## Problem Statement
{{problem}}

## Proposed Solution
{{solution}}

## Timeline
{{timeline}}

## Budget
{{budget}}

## Expected Outcomes
{{outcomes}}`,
    variables: ['project_name', 'executive_summary', 'problem', 'solution', 'timeline', 'budget', 'outcomes']
  }
];

export function getTemplateById(id: string): FormatTemplate | undefined {
  return FORMAT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: FormatTemplate['category']): FormatTemplate[] {
  return FORMAT_TEMPLATES.filter(template => template.category === category);
}

export function applyTemplate(template: FormatTemplate, variables: Record<string, string>): string {
  let result = template.template;
  
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
  }
  
  // Replace any remaining variables with placeholders
  result = result.replace(/{{(\w+)}}/g, '[$1]');
  
  return result;
}
