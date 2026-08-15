import { POST as handlePost } from '../turn/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handlePost(request);
}
