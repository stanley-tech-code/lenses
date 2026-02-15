import { NextRequest, NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/queue/automation-engine';

export async function GET(request: NextRequest) {
  // In production, verify a secret token to prevent abuse
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  await processDueReminders();
  return NextResponse.json({ ok: true });
}
