import { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('files');

    if (!files || files.length < 2) {
      return new Response('At least two PDF files are required.', { status: 400 });
    }

    const mergedPdf = await PDFDocument.create();

    for (const item of files) {
      if (!(item instanceof File)) {
        return new Response('Invalid file input.', { status: 400 });
      }
      // Validate type
      if (item.type !== 'application/pdf') {
        return new Response('Only PDF files are supported.', { status: 415 });
      }

      const ab = await item.arrayBuffer();
      const src = await PDFDocument.load(new Uint8Array(ab));
      const copied = await mergedPdf.copyPages(src, src.getPageIndices());
      for (const p of copied) mergedPdf.addPage(p);
    }

    const bytes = await mergedPdf.save();
    const buf = Buffer.from(bytes);

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="combined.pdf"',
        'Cache-Control': 'no-store',
        'Content-Length': String(buf.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // If the error is due to body size/proxy limits, hint with 413
    if (msg.toLowerCase().includes('body') && msg.toLowerCase().includes('limit')) {
      return new Response('Payload too large', { status: 413 });
    }
    return new Response(`Failed to combine PDFs: ${msg}`, { status: 500 });
  }
}