import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';
import { testPosConnection } from '@/lib/pos/integration';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const { baseUrl, apiKey } = await request.json();

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
  }

  const result = await testPosConnection(baseUrl, apiKey);
  return NextResponse.json(result);
}
