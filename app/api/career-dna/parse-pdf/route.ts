import { NextResponse } from 'next/server';
import { parsePdfBuffer, isHumanResumeText } from '@/lib/parsers/pdf-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extractedText = await parsePdfBuffer(buffer, file.name);

    const isValid = isHumanResumeText(extractedText);

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      isValidHumanText: isValid,
    });
  } catch (error: any) {
    console.error('PDF parsing endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
