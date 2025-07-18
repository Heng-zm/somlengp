
'use server';
/**
 * @fileOverview A flow for converting multiple images into a single PDF document.
 *
 * - imageToPdf - A function that handles the image to PDF conversion process.
 * - ImageToPdfInput - The input type for the function.
 * - ImageToPdfOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {PDFDocument, PDFImage} from 'pdf-lib';
import { MAX_BASE64_SIZE_BYTES } from '@/config';

const ImageToPdfInputSchema = z.object({
  imageDataUris: z
    .array(z.string())
    .describe(
      "An array of image files as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ImageToPdfInput = z.infer<typeof ImageToPdfInputSchema>;

const ImageToPdfOutputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe('The generated PDF file as a data URI.'),
});
export type ImageToPdfOutput = z.infer<typeof ImageToPdfOutputSchema>;

export async function imageToPdf(
  input: ImageToPdfInput
): Promise<ImageToPdfOutput> {
  return imageToPdfFlow(input);
}

const imageToPdfFlow = ai.defineFlow(
  {
    name: 'imageToPdfFlow',
    inputSchema: ImageToPdfInputSchema,
    outputSchema: ImageToPdfOutputSchema,
  },
  async ({imageDataUris}) => {
    if (imageDataUris.length === 0) {
      throw new Error('No image files provided to convert.');
    }

    const totalSize = imageDataUris.reduce((acc, uri) => acc + uri.length, 0);
    if (totalSize > MAX_BASE64_SIZE_BYTES) {
        throw new Error('413: Payload Too Large. Combined image size exceeds the server limit.');
    }

    const pdfDoc = await PDFDocument.create();

    for (const dataUri of imageDataUris) {
        const imageBytes = Buffer.from(dataUri.split(',')[1], 'base64');
        let pdfImage: PDFImage;

        if (dataUri.startsWith('data:image/jpeg') || dataUri.startsWith('data:image/jpg')) {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else if (dataUri.startsWith('data:image/png')) {
            pdfImage = await pdfDoc.embedPng(imageBytes);
        } else {
            // Skip unsupported image formats for now. 
            // In a real app, you might want to handle this more gracefully.
            console.warn(`Skipping unsupported image type for data URI: ${dataUri.substring(0, 30)}...`);
            continue;
        }

        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
            x: 0,
            y: 0,
            width: pdfImage.width,
            height: pdfImage.height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    return {
      pdfDataUri: `data:application/pdf;base64,${pdfBase64}`,
    };
  }
);
