import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';
import { testSmsConnection, type SmsConfig } from '@/lib/sms/client';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const { to, config, branchName } = await request.json();

  if (!to || !config) {
    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
  }

  const result = await testSmsConnection(to, config as SmsConfig, branchName ?? 'Lenses');
  return NextResponse.json(result);
}
