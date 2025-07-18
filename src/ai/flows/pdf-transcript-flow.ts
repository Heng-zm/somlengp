
'use server';
/**
 * @fileOverview An AI agent for transcribing text from PDF files.
 *
 * - transcribePdf - A function that handles the PDF to text transcription process.
 * - TranscribePdfInput - The input type for the function.
 * - TranscribePdfOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { MAX_BASE64_SIZE_BYTES } from '@/config';

const TranscribePdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
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
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: TranscribePdfInputSchema},
  output: {schema: TranscribePdfOutputSchema},
  prompt: `You are an expert at extracting high-quality, clean text from PDF documents.
Your primary goal is to maintain the original layout and structure of the document as precisely as possible.

- Preserve columns: If the text is in columns, your output must reflect that structure.
- Preserve tables: Recreate the table structure with appropriate spacing.
- Preserve paragraphs: Maintain original paragraph breaks.
- Preserve line breaks: Keep line breaks within paragraphs where they exist.
- Preserve formatting: Replicate bolding, italics, or other text styles if possible.

Extract all the text content from the provided PDF file.
Do not add any commentary, explanations, or extra text that is not in the original PDF. The output should be only the text from the document, perfectly formatted.

PDF File: {{media url=pdfDataUri}}`,
});

const pdfTranscriptFlow = ai.defineFlow(
  {
    name: 'pdfTranscriptFlow',
    inputSchema: TranscribePdfInputSchema,
    outputSchema: TranscribePdfOutputSchema,
  },
  async input => {
    if (input.pdfDataUri.length > MAX_BASE64_SIZE_BYTES) {
        throw new Error('413: Payload Too Large. PDF file size exceeds the server limit.');
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error(
        'PDF to Text transcription failed: The model did not return any output.'
      );
    }
    return output;
  }
);
