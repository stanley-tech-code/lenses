
/**
 * POST /api/webhooks/pos
 * 
 * Receives real-time events from the Baus Optical POS system.
 * The POS should be configured to send events to:
 *   https://yourdomain.com/api/webhooks/pos
 * 
 * Headers expected from POS:
 *   X-Branch-ID: <branchId>
 *   X-Webhook-Signature: sha256=<hmac_signature>
 *   Content-Type: application/json
 * 
 * The HMAC secret is configured per branch in PosConfig.webhookSecret
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, normalizeWebhookPayload } from '@/lib/pos/integration';
import { processPosEvent } from '@/lib/queue/automation-engine';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // ── 1. Get raw body for signature verification ──
  const rawBody = await request.text();

  // ── 2. Extract headers ──
  const branchId = request.headers.get('X-Branch-ID') ?? request.headers.get('x-branch-id');
  const signature = request.headers.get('X-Webhook-Signature') ?? request.headers.get('x-webhook-signature');

  if (!branchId) {
    return NextResponse.json({ error: 'Missing X-Branch-ID header' }, { status: 400 });
  }

  // ── 3. Get branch webhook secret ──
  const posConfig = await prisma.posConfig.findUnique({
    where: { branchId },
  });

  if (!posConfig) {
    return NextResponse.json({ error: 'Branch not configured' }, { status: 404 });
  }

  if (!posConfig.webhookEnabled) {
    return NextResponse.json({ error: 'Webhooks disabled for this branch' }, { status: 403 });
  }

  // ── 4. Verify HMAC signature ──
  if (signature) {
    const isValid = verifyWebhookSignature(rawBody, signature, posConfig.webhookSecret);
    if (!isValid) {
      console.warn(`[Webhook] Invalid signature from branch ${branchId}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    // Log warning but allow through if no signature (some POS systems don't support HMAC)
    console.warn(`[Webhook] No signature header from branch ${branchId} — consider enforcing signatures`);
  }

  // ── 5. Parse payload ──
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── 6. Update last webhook timestamp ──
  await prisma.posConfig.update({
    where: { branchId },
    data: { lastWebhookReceivedAt: new Date() },
  });

  // ── 7. Handle batch payloads (some POS systems send arrays) ──
  const events = Array.isArray(payload) ? payload : [payload];
  const results = [];

  for (const eventPayload of events) {
    const normalized = normalizeWebhookPayload(eventPayload as Record<string, unknown>, branchId);

    if (!normalized) {
      results.push({ status: 'skipped', reason: 'Unknown or unmappable event type' });
      continue;
    }

    // ── 8. Process asynchronously (don't block webhook response) ──
    // We respond 200 immediately and process in the background
    processPosEvent(normalized)
      .then((result) => {
        console.log(`[Webhook] Event ${normalized.posEventId} processed:`, result);
      })
      .catch((error) => {
        console.error(`[Webhook] Failed to process event ${normalized.posEventId}:`, error);
      });

    results.push({
      status: 'accepted',
      eventType: normalized.eventType,
      posEventId: normalized.posEventId,
    });
  }

  // ── 9. Respond immediately to POS (< 5s to avoid timeout) ──
  return NextResponse.json({
    received: true,
    processed: results.length,
    results,
  });
}

// Health check — POS can ping this to verify the webhook URL is live
export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get('branchId');

  if (!branchId) {
    return NextResponse.json({ status: 'ok', message: 'Lenses webhook endpoint is active' });
  }

  const posConfig = await prisma.posConfig.findUnique({
    where: { branchId },
    select: { webhookEnabled: true, lastWebhookReceivedAt: true },
  });

  return NextResponse.json({
    status: 'ok',
    branchId,
    webhookEnabled: posConfig?.webhookEnabled ?? false,
    lastEventReceived: posConfig?.lastWebhookReceivedAt ?? null,
  });
}
