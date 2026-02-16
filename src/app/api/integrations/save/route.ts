
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch config for a branch
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = request.nextUrl.searchParams.get('branchId') || auth.branchId;
  if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

  const config = await prisma.posConfig.findUnique({
    where: { branchId },
  });

  return NextResponse.json(config || {});
}

// POST: Save config
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const body = await request.json();
  const { branchId } = body;

  if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

  // Ensure user has access to this branch
  if (auth.role !== 'SUPER_ADMIN' && auth.branchId !== branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const config = await prisma.posConfig.upsert({
      where: { branchId },
      update: {
        posApiKey: body.posApiKey,
        posApiBaseUrl: body.posApiBaseUrl,
        webhookEnabled: body.webhookEnabled,
        smsProvider: body.smsProvider,
        smsApiKey: body.smsApiKey,
        smsUsername: body.smsUsername,
        smsSenderId: body.smsSenderId,
        automationEnabled: body.automationEnabled,
        retryFailedSms: body.retryFailedSms,
        defaultDelayMinutes: Number.parseInt(body.defaultDelayMinutes, 10),
        optOutKeyword: body.optOutKeyword,
      },
      create: {
        branchId,
        posApiKey: body.posApiKey,
        posApiBaseUrl: body.posApiBaseUrl,
        webhookEnabled: body.webhookEnabled,
        webhookSecret: crypto.randomBytes(32).toString('hex'), // Generate secret on first save
        smsProvider: body.smsProvider,
        smsApiKey: body.smsApiKey,
        smsUsername: body.smsUsername,
        smsSenderId: body.smsSenderId,
        automationEnabled: body.automationEnabled,
        retryFailedSms: body.retryFailedSms,
        defaultDelayMinutes: Number.parseInt(body.defaultDelayMinutes, 10),
        optOutKeyword: body.optOutKeyword,
      },
    });

    const webhookUrl = `${request.nextUrl.origin}/api/webhooks/pos`;

    return NextResponse.json({
      success: true,
      webhookSecret: config.webhookSecret,
      webhookUrl,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
