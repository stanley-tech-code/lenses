
import { NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/queue/automation-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  // In production, verify a secret token to prevent abuse
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  await processDueReminders();
  return NextResponse.json({ ok: true });
}
