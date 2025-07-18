
'use server';
/**
 * @fileOverview An AI agent for transcribing text from PDF files.
 *
 * - transcribePdf - A function that handles the PDF to text transcription process.
 * - TranscribePdfInput - The input type for the function.
 * - TranscribePdfOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribePdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
  model: z
    .string()
    .optional()
    .describe('The AI model to use for transcription.'),
});
export type TranscribePdfInput = z.infer<typeof TranscribePdfInputSchema>;

const TranscribePdfOutputSchema = z.object({
  text: z.string().describe('The transcribed text from the PDF.'),
});
export type TranscribePdfOutput = z.infer<typeof TranscribePdfOutputSchema>;

export async function transcribePdf(
  input: TranscribePdfInput
): Promise<TranscribePdfOutput> {
  return pdfTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pdfTranscriptPrompt',
  input: {schema: TranscribePdfInputSchema},
  output: {schema: TranscribePdfOutputSchema},
  prompt: `You are an expert at extracting high-quality, clean text from PDF documents.
Your primary goal is to maintain the original layout and structure of the document, including columns, tables, paragraphs, and line breaks.

If the PDF contains text arranged in columns, you MUST preserve this columnar structure in your output. Use appropriate spacing or formatting to represent the columns as accurately as possible.

Extract all the text content from the provided PDF file.
Do not add any commentary or extra text that is not in the original PDF.

PDF File: {{media url=pdfDataUri}}`,
});

const pdfTranscriptFlow = ai.defineFlow(
  {
    name: 'pdfTranscriptFlow',
    inputSchema: TranscribePdfInputSchema,
    outputSchema: TranscribePdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error(
        'PDF to Text transcription failed: The model did not return any output.'
      );
    }
    return output;
  }
);
