import { NextRequest } from 'next/server';
import { POST as handlePost } from './route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handlePost(request);
}

export { POST } from './route';
