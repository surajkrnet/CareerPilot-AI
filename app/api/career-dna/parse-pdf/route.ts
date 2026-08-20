import { NextResponse } from 'next/server';
import { extractTextFromDocument } from '@/lib/parsers/document-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = 'document.pdf';
    let mimeType = '';
    let fileSize = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No document file attached. Please select a file (PDF, DOCX, DOC, TXT, RTF).' }, { status: 400 });
      }

      fileName = file.name;
      mimeType = file.type || '';
      fileSize = file.size;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const arrayBuffer = await request.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return NextResponse.json({ error: 'Empty file payload received.' }, { status: 400 });
      }
      fileBuffer = Buffer.from(arrayBuffer);
      fileSize = fileBuffer.length;
    }

    // Universal multi-format extraction (PDF, DOCX, DOC, TXT, RTF, MD)
    const result = await extractTextFromDocument({
      buffer: fileBuffer,
      fileName,
      mimeType,
    });

    if (!result.success || !result.text) {
      return NextResponse.json(
        {
          error: result.error || 'We could not extract readable text from this document. Please upload a standard text-based PDF, DOCX, or TXT file.',
          partialText: result.text || '',
          wordCount: result.wordCount,
          fileType: result.fileType,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: result.text,
      fileName,
      fileSize,
      wordCount: result.wordCount,
      fileType: result.fileType,
      classification: result.classification,
    });
  } catch (error: any) {
    console.error('Document parsing endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse document. Please upload a standard PDF or DOCX file.' },
      { status: 500 }
    );
  }
}
