
'use server';
/**
 * @fileOverview A flow for combining multiple PDF documents into a single PDF.
 *
 * - combinePdf - A function that handles the PDF combination process.
 * - CombinePdfInput - The input type for the function.
 * - CombinePdfOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {PDFDocument} from 'pdf-lib';

const CombinePdfInputSchema = z.object({
  pdfDataUris: z
    .array(z.string())
    .describe(
      "An array of PDF files as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
});
export type CombinePdfInput = z.infer<typeof CombinePdfInputSchema>;

const CombinePdfOutputSchema = z.object({
  combinedPdfDataUri: z
    .string()
    .describe('The combined PDF file as a data URI.'),
});
export type CombinePdfOutput = z.infer<typeof CombinePdfOutputSchema>;

export async function combinePdf(
  input: CombinePdfInput
): Promise<CombinePdfOutput> {
  return combinePdfFlow(input);
}

const combinePdfFlow = ai.defineFlow(
  {
    name: 'combinePdfFlow',
    inputSchema: CombinePdfInputSchema,
    outputSchema: CombinePdfOutputSchema,
  },
  async ({pdfDataUris}) => {
    if (pdfDataUris.length === 0) {
      throw new Error('No PDF files provided to combine.');
    }

    const mergedPdf = await PDFDocument.create();

    for (const dataUri of pdfDataUris) {
      const pdfBytes = Buffer.from(dataUri.split(',')[1], 'base64');
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedPdfBase64 = Buffer.from(mergedPdfBytes).toString('base64');

    return {
      combinedPdfDataUri: `data:application/pdf;base64,${mergedPdfBase64}`,
    };
  }
);
