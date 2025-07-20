
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
  model: 'gemini-1.5-pro',
  input: {schema: TranscribePdfInputSchema},
  output: {schema: TranscribePdfOutputSchema},
  prompt: `You are a meticulous digital archivist. Your one and only mission is to extract the text from the provided PDF document and replicate its layout and structure with perfect fidelity. Any deviation is a failure.

You MUST adhere to the following rules without exception:
- **Structural Integrity:** Your primary goal is to maintain the original layout. This includes preserving columns, tables, headers, footers, and any other structural elements.
- **Spacing is Crucial:** Replicate all whitespace, indentation, and alignment exactly as it appears in the original document. Use spaces to align text in columns and tables.
- **Preserve All Breaks:** Every paragraph break and line break must be maintained. Do not merge lines or paragraphs.
- **No Commentary:** Do NOT add any extra text, explanations, summaries, or apologies. Your output must ONLY be the text content from the PDF.
- **Formatting:** While you cannot replicate fonts or colors, you should represent formatting like bold or italics using markdown if possible (e.g., **bold text**, *italic text*).

Your output will be a direct, text-based mirror of the document provided. Begin extraction now.

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
