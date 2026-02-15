/**
 * POST /api/integrations/save
 * Saves POS + SMS configuration for a branch
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse, canAccessBranch } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();
  if (auth.role === 'STAFF') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const {
      branchId,
      posApiKey,
      posApiBaseUrl,
      webhookEnabled,
      smsProvider,
      smsApiKey,
      smsUsername,
      smsSenderId,
      automationEnabled,
      retryFailedSms,
      defaultDelayMinutes,
      optOutKeyword,
    } = body;

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    if (!canAccessBranch(auth, branchId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await prisma.posConfig.upsert({
      where: { branchId },
      update: {
        posApiKey: posApiKey ?? undefined,
        posApiBaseUrl: posApiBaseUrl ?? undefined,
        webhookEnabled: webhookEnabled ?? true,
        smsProvider: smsProvider ?? undefined,
        smsApiKey: smsApiKey ?? undefined,
        smsUsername: smsUsername ?? undefined,
        smsSenderId: smsSenderId ?? undefined,
        automationEnabled: automationEnabled ?? true,
        retryFailedSms: retryFailedSms ?? true,
        defaultDelayMinutes: defaultDelayMinutes ?? 10,
        optOutKeyword: optOutKeyword ?? 'STOP',
      },
      create: {
        branchId,
        webhookSecret: generateWebhookSecret(),
        posApiKey: posApiKey ?? null,
        posApiBaseUrl: posApiBaseUrl ?? null,
        webhookEnabled: webhookEnabled ?? true,
        smsProvider: smsProvider ?? 'AFRICAS_TALKING',
        smsApiKey: smsApiKey ?? null,
        smsUsername: smsUsername ?? null,
        smsSenderId: smsSenderId ?? null,
        automationEnabled: automationEnabled ?? true,
        retryFailedSms: retryFailedSms ?? true,
        defaultDelayMinutes: defaultDelayMinutes ?? 10,
        optOutKeyword: optOutKeyword ?? 'STOP',
      },
    });

    return NextResponse.json({
      success: true,
      webhookSecret: config.webhookSecret,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pos`,
    });
  } catch (error) {
    console.error('[Integrations] Save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = request.nextUrl.searchParams.get('branchId') ?? auth.branchId;
  if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });
  if (!canAccessBranch(auth, branchId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const config = await prisma.posConfig.findUnique({
    where: { branchId },
    select: {
      posApiBaseUrl: true,
      posApiKey: true,
      webhookEnabled: true,
      webhookSecret: true,
      smsProvider: true,
      smsSenderId: true,
      automationEnabled: true,
      retryFailedSms: true,
      defaultDelayMinutes: true,
      optOutKeyword: true,
      lastWebhookReceivedAt: true,
      lastApiPollAt: true,
      // Never return smsApiKey or smsUsername in plain text — mask it
    },
  });

  if (!config) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    ...config,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pos`,
    // Mask API keys — only show last 4 chars
    posApiKey: config.posApiKey ? '••••••••' + config.posApiKey.slice(-4) : null,
  });
}

function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
