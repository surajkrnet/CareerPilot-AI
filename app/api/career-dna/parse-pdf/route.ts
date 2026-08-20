import { NextResponse } from 'next/server';
import { extractTextFromDocument } from '@/lib/parsers/document-parser';
import {
  validateFileSignature,
  validateDocumentForSlot,
} from '@/lib/security/document-validator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const querySlot = url.searchParams.get('slot') || url.searchParams.get('expectedType');
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = 'document.pdf';
    let mimeType = '';
    let fileSize = 0;
    let expectedSlot: 'resume' | 'job_description' =
      querySlot === 'job_description' ? 'job_description' : 'resume';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const formSlot = formData.get('slot') as string | null;
      const formExpectedType = formData.get('expectedType') as string | null;

      if (formSlot === 'job_description' || formExpectedType === 'job_description') {
        expectedSlot = 'job_description';
      }

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: 'No document file attached. Please select a file (PDF, DOCX, DOC, TXT, RTF).' },
          { status: 400 }
        );
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

    // 1. File-level validation: Magic Bytes & Format Verification
    const sigCheck = validateFileSignature(fileBuffer, fileName, mimeType);
    if (!sigCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          accepted: false,
          error: sigCheck.error || 'Invalid or corrupted file format. Please upload a standard PDF, DOCX, or TXT document.',
          aiAllowed: false,
        },
        { status: 400 }
      );
    }

    // 2. Multi-Format Text Extraction
    const result = await extractTextFromDocument({
      buffer: fileBuffer,
      fileName,
      mimeType,
    });

    if (!result.success || !result.text) {
      return NextResponse.json(
        {
          success: false,
          accepted: false,
          error:
            result.error ||
            'We could not extract readable text from this document. Please upload a standard text-based PDF, DOCX, or TXT file.',
          partialText: result.text || '',
          wordCount: result.wordCount,
          fileType: result.fileType,
          aiAllowed: false,
        },
        { status: 422 }
      );
    }

    // 3. Pre-AI Document Semantic Classification & Prompt-Injection Security Guard
    const validation = validateDocumentForSlot({
      text: result.text,
      expectedSlot,
      fileName,
    });

    if (!validation.accepted) {
      return NextResponse.json(
        {
          success: false,
          accepted: false,
          error: validation.userMessage,
          reason: validation.reason,
          documentType: validation.documentType,
          confidence: validation.confidence,
          riskLevel: validation.riskLevel,
          securityFlags: validation.securityFlags,
          aiAllowed: false,
          wordCount: validation.wordCount,
        },
        { status: 422 }
      );
    }

    // 4. Document Accepted & Verified
    return NextResponse.json({
      success: true,
      accepted: true,
      text: validation.sanitizedText || result.text,
      fileName,
      fileSize,
      wordCount: validation.wordCount,
      fileType: result.fileType,
      classification: {
        type: validation.documentType,
        confidence: validation.confidence,
        riskLevel: validation.riskLevel,
      },
      validation,
      aiAllowed: true,
    });
  } catch (error: any) {
    console.error('Document parsing endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse document. Please upload a standard PDF or DOCX file.' },
      { status: 500 }
    );
  }
}
