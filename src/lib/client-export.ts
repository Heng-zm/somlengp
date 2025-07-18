
'use client';

import { Document, Packer, Paragraph, TextRun } from "docx";

export async function exportToDocx(text: string): Promise<Blob> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => 
            new Paragraph({
                children: [new TextRun(line)]
            })
        ),
      }],
    });
  
    return await Packer.toBlob(doc);
}
