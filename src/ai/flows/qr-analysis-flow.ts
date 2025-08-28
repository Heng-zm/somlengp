'use server';
/**
 * @fileOverview QR Code Content Analysis AI Flow
 * 
 * Provides intelligent analysis of QR code content including:
 * - Security risk assessment
 * - Content categorization and tagging
 * - Action recommendations
 * - Contextual insights
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

// Input schema for QR analysis
const QRAnalysisInputSchema = z.object({
  content: z.string().describe('The raw content of the QR code'),
  type: z.string().describe('The detected type of QR code (url, text, wifi, etc.)'),
  context: z.object({
    scanLocation: z.string().optional().describe('Where the QR code was scanned (optional)'),
    scanTime: z.number().describe('Timestamp of when the QR code was scanned'),
    userPreferences: z.object({
      strictSecurity: z.boolean().default(false),
      categories: z.array(z.string()).optional()
    }).optional()
  }).optional()
});

// Output schema for analysis results
const QRAnalysisOutputSchema = z.object({
  security: z.object({
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    riskScore: z.number().min(0).max(100),
    threats: z.array(z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical'])
    })),
    recommendations: z.array(z.string())
  }),
  categorization: z.object({
    primaryCategory: z.string(),
    subcategories: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    suggestedTags: z.array(z.string())
  }),
  insights: z.object({
    summary: z.string(),
    keyInformation: z.array(z.object({
      label: z.string(),
      value: z.string(),
      importance: z.enum(['low', 'medium', 'high'])
    })),
    relatedActions: z.array(z.object({
      action: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high'])
    }))
  }),
  metadata: z.object({
    analysisDate: z.number(),
    confidence: z.number().min(0).max(1),
    processingTime: z.number().optional(),
    version: z.string().default('1.0')
  })
});

export type QRAnalysisInput = z.infer<typeof QRAnalysisInputSchema>;
export type QRAnalysisOutput = z.infer<typeof QRAnalysisOutputSchema>;

// Define the analysis prompt
const analysisPrompt = ai.definePrompt({
  name: 'qrAnalysisPrompt',
  model: googleAI.model('gemini-1.5-pro-latest'),
  input: { schema: QRAnalysisInputSchema },
  output: { schema: QRAnalysisOutputSchema },
  prompt: `You are an advanced QR code security and content analysis expert. Analyze the provided QR code content and provide comprehensive insights.

QR Code Content: {{content}}
QR Code Type: {{type}}
{{#if context.scanLocation}}Scan Location: {{context.scanLocation}}{{/if}}
Scan Time: {{context.scanTime}}

Provide a detailed analysis covering:

1. SECURITY ASSESSMENT:
   - Evaluate potential security risks (phishing, malware, suspicious domains, etc.)
   - Assign risk level and score based on content analysis
   - Identify specific threats and provide actionable recommendations
   - Consider URL reputation, domain age, HTTPS usage, and suspicious patterns

2. SMART CATEGORIZATION:
   - Determine the most appropriate primary category
   - Suggest relevant subcategories and tags
   - Provide confidence level for categorization
   - Consider content context and user behavior patterns

3. INTELLIGENT INSIGHTS:
   - Extract key information and metadata
   - Identify actionable items and next steps
   - Provide contextual summary and recommendations
   - Suggest related actions based on content type

Be thorough but concise. Focus on practical, actionable insights that help users make informed decisions about the QR code content.`,
});

// Define the analysis flow
const qrAnalysisFlow = ai.defineFlow(
  {
    name: 'qrAnalysisFlow',
    inputSchema: QRAnalysisInputSchema,
    outputSchema: QRAnalysisOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    
    try {
      const { output } = await analysisPrompt(input);
      
      if (!output) {
        throw new Error('QR analysis failed: No output received from AI model');
      }

      // Add metadata
      const processingTime = Date.now() - startTime;
      output.metadata = {
        ...output.metadata,
        analysisDate: startTime,
        processingTime,
        version: '1.0'
      };

      // Validate and enhance security analysis
      if (output.security.riskScore < 0 || output.security.riskScore > 100) {
        output.security.riskScore = Math.max(0, Math.min(100, output.security.riskScore));
      }

      // Ensure consistency between risk level and score
      if (output.security.riskScore >= 80) {
        output.security.riskLevel = 'critical';
      } else if (output.security.riskScore >= 60) {
        output.security.riskLevel = 'high';
      } else if (output.security.riskScore >= 30) {
        output.security.riskLevel = 'medium';
      } else {
        output.security.riskLevel = 'low';
      }

      return output;
    } catch (error) {
      console.error('QR Analysis Flow error:', error);
      
      // Return basic analysis as fallback
      return {
        security: {
          riskLevel: 'medium' as const,
          riskScore: 50,
          threats: [],
          recommendations: ['Unable to complete full security analysis', 'Proceed with caution']
        },
        categorization: {
          primaryCategory: 'Unknown',
          subcategories: [],
          confidence: 0.3,
          suggestedTags: [input.type || 'unknown']
        },
        insights: {
          summary: 'Analysis could not be completed due to technical issues.',
          keyInformation: [
            {
              label: 'Content',
              value: input.content.substring(0, 100) + (input.content.length > 100 ? '...' : ''),
              importance: 'medium' as const
            }
          ],
          relatedActions: []
        },
        metadata: {
          analysisDate: startTime,
          confidence: 0.3,
          processingTime: Date.now() - startTime,
          version: '1.0'
        }
      };
    }
  }
);

// Export the main analysis function
export async function analyzeQRContent(input: QRAnalysisInput): Promise<QRAnalysisOutput> {
  return qrAnalysisFlow(input);
}

// Convenience function for basic analysis
export async function quickAnalyzeQR(content: string, type: string): Promise<QRAnalysisOutput> {
  return analyzeQRContent({
    content,
    type,
    context: {
      scanTime: Date.now()
    }
  });
}
