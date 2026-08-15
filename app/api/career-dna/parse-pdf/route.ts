import { NextResponse } from 'next/server';
import { parsePdfBuffer, countRecognizableWords, isHumanResumeText } from '@/lib/parsers/pdf-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = 'resume.pdf';
    let fileSize = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No PDF file attached. Please select a resume file.' }, { status: 400 });
      }

      fileName = file.name;
      fileSize = file.size;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const arrayBuffer = await request.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return NextResponse.json({ error: 'Empty file payload received' }, { status: 400 });
      }
      fileBuffer = Buffer.from(arrayBuffer);
      fileSize = fileBuffer.length;
    }

    // Server-side PDF extraction with unpdf & multi-engine fallback
    const extractedText = await parsePdfBuffer(fileBuffer, fileName);
    const wordCount = countRecognizableWords(extractedText);

    // Guardrail: Ensure extracted text is genuine human content with at least 25-30 words
    if (!isHumanResumeText(extractedText) || wordCount < 20) {
      return NextResponse.json(
        {
          error: 'Could not extract sufficient text from this PDF format. Please paste your resume text directly into the box.',
          partialText: extractedText || '',
          wordCount,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName,
      fileSize,
      wordCount,
    });
  } catch (error: any) {
    console.error('PDF parsing endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse PDF document. Please paste resume text directly.' },
      { status: 500 }
    );
  }
}
