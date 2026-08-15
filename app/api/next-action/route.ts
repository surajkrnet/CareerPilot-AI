import { POST as handlePost, GET as handleGet } from '../dashboard/next-action/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handlePost(request);
}

export async function GET(request: Request) {
  return handleGet(request);
}
