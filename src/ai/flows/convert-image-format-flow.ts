
'use server';
/**
 * @fileOverview An AI agent for converting image formats.
 *
 * - convertImageFormat - A function that handles the image conversion process.
 * - ConvertImageFormatInput - The input type for the function.
 * - ConvertImageFormatOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import {MAX_BASE64_SIZE_BYTES} from '@/config';

const ConvertImageFormatInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image file as a data URI. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  targetFormat: z
    .enum(['jpeg', 'png', 'webp'])
    .describe('The target format to convert the image to.'),
});
export type ConvertImageFormatInput = z.infer<
  typeof ConvertImageFormatInputSchema
>;

const ConvertImageFormatOutputSchema = z.object({
  convertedImageDataUri: z
    .string()
    .describe('The converted image file as a data URI.'),
});
export type ConvertImageFormatOutput = z.infer<
  typeof ConvertImageFormatOutputSchema
>;

export async function convertImageFormat(
  input: ConvertImageFormatInput
): Promise<ConvertImageFormatOutput> {
  return convertImageFormatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'convertImageFormatPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: ConvertImageFormatInputSchema},
  output: {schema: ConvertImageFormatOutputSchema},
  prompt: `You are an expert image processing service.
Your task is to convert the provided image to the specified target format.

- **Image Input:** You will receive an image as a data URI.
- **Target Format:** You will receive a target format (e.g., 'jpeg', 'png', 'webp').
- **Output:** You must return the converted image as a new data URI in the requested format.

Do not perform any other transformations. Only convert the format.

Image: {{media url=imageDataUri}}
Target Format: {{{targetFormat}}}
`,
  config: {
    // Note: Gemini will output a JPG if you don't specify a mimeType, even for PNGs.
    // It's better to let the model decide based on the prompt.
    // responseMimeType: 'image/png',
  },
});

const convertImageFormatFlow = ai.defineFlow(
  {
    name: 'convertImageFormatFlow',
    inputSchema: ConvertImageFormatInputSchema,
    outputSchema: ConvertImageFormatOutputSchema,
  },
  async input => {
    if (input.imageDataUri.length > MAX_BASE64_SIZE_BYTES) {
      throw new Error(
        '413: Payload Too Large. Image file size exceeds the server limit.'
      );
    }
    const {output} = await prompt(input);

    if (!output?.convertedImageDataUri) {
      throw new Error(
        'Image conversion failed: The model did not return any output.'
      );
    }
    return {
      convertedImageDataUri: output.convertedImageDataUri,
    };
  }
);
