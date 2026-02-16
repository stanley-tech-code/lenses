/**
 * Baus Optical POS Integration Layer
 * 
 * Handles two integration modes:
 * 1. API Mode  — We pull events from the POS using their REST API + API key
 * 2. Webhook Mode — POS pushes events to us at POST /api/webhooks/pos
 *
 * Both modes produce a normalized PosEventPayload that feeds the automation engine.
 */

import crypto from 'node:crypto';

// ─────────────────────────────────────────────
// Normalized Event (shared between API + Webhook)
// ─────────────────────────────────────────────

export type PosEventType =
  | 'AFTER_VISIT'
  | 'AFTER_PURCHASE'
  | 'REPAIR_LOGGED'
  | 'REPAIR_COMPLETED'
  | 'ORDER_COLLECTED'
  | 'CUSTOM_TIME_REMINDER'
  | 'FOLLOWUP_NEEDED'
  | 'SEASONAL_CHECKUP'
  | 'EYE_EXAM_DUE';

export interface NormalizedPosEvent {
  eventType: PosEventType;
  posEventId: string;        // Unique ID from POS (used for deduplication)
  branchId: string;
  customerPhone: string;
  customerName: string;
  orderId?: string;
  appointmentDate?: string;
  doctorName?: string;
  productName?: string;
  rawPayload: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Event Type Mapping
// Maps POS system's event names → our internal TriggerEvent enum
// Update these keys to match your actual POS event names
// ─────────────────────────────────────────────

const EVENT_TYPE_MAP: Record<string, PosEventType> = {
  // Baus POS event names → our event types
  'sale.completed': 'AFTER_PURCHASE',
  'sale_completed': 'AFTER_PURCHASE',
  'purchase.done': 'AFTER_PURCHASE',
  'visit.checkedout': 'AFTER_VISIT',
  'visit_completed': 'AFTER_VISIT',
  'patient.checked_out': 'AFTER_VISIT',
  'repair.created': 'REPAIR_LOGGED',
  'repair.logged': 'REPAIR_LOGGED',
  'repair.completed': 'REPAIR_COMPLETED',
  'repair.done': 'REPAIR_COMPLETED',
  'order.ready': 'ORDER_COLLECTED',
  'order.collected': 'ORDER_COLLECTED',
  'order_ready': 'ORDER_COLLECTED',
  'reminder.due': 'CUSTOM_TIME_REMINDER',
  'followup.needed': 'FOLLOWUP_NEEDED',
  'exam.due': 'EYE_EXAM_DUE',
  'checkup.seasonal': 'SEASONAL_CHECKUP',
};

// ─────────────────────────────────────────────
// Webhook Signature Verification
// Verifies HMAC-SHA256 signature from POS
// ─────────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    // Support both "sha256=xxxx" and plain hex formats
    const incoming = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    console.log(`[Debug] Sig Verify: Expected=${expected}, Incoming=${incoming}, Secret=${secret.slice(0, 5)}...`);

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(incoming, 'hex')
    );
  } catch (error) {
    console.error('[Debug] Sig Verify Error:', error);
    return false;
  }
}

// ─────────────────────────────────────────────
// Webhook Payload Normalizer
// Converts raw POS webhook payload → NormalizedPosEvent
// Update field mappings to match your actual POS JSON structure
// ─────────────────────────────────────────────

export function normalizeWebhookPayload(
  rawPayload: Record<string, unknown>,
  branchId: string
): NormalizedPosEvent | null {
  try {
    // Try to extract event type from common field names
    const rawEventType = (
      rawPayload.event_type ??
      rawPayload.eventType ??
      rawPayload.event ??
      rawPayload.type ??
      rawPayload.action ??
      ''
    ) as string;

    const eventType = EVENT_TYPE_MAP[rawEventType.toLowerCase()];
    if (!eventType) {
      console.warn(`[POS] Unknown event type: "${rawEventType}"`);
      return null;
    }

    // Extract customer data — handles nested or flat structures
    const customer = (rawPayload.customer ?? rawPayload.patient ?? rawPayload) as Record<string, unknown>;

    const customerPhone = (
      customer.phone ??
      customer.phone_number ??
      customer.mobile ??
      rawPayload.phone ??
      rawPayload.customer_phone ??
      ''
    ) as string;

    const customerName = (
      customer.name ??
      customer.full_name ??
      `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() ??
      rawPayload.customer_name ??
      'Valued Customer'
    ) as string;

    if (!customerPhone) {
      console.warn('[POS] Event missing customer phone, skipping');
      return null;
    }

    // Extract order/appointment details
    const orderId = (
      rawPayload.order_id ??
      rawPayload.orderId ??
      rawPayload.sale_id ??
      rawPayload.receipt_number ??
      rawPayload.repair_id ??
      undefined
    ) as string | undefined;

    const appointmentDate = (
      rawPayload.appointment_date ??
      rawPayload.visit_date ??
      rawPayload.scheduled_at ??
      undefined
    ) as string | undefined;

    const doctorName = (
      rawPayload.doctor ??
      rawPayload.doctor_name ??
      rawPayload.staff_name ??
      undefined
    ) as string | undefined;

    const productName = (
      rawPayload.product ??
      rawPayload.product_name ??
      rawPayload.item_name ??
      undefined
    ) as string | undefined;

    // Generate a stable event ID for deduplication
    const posEventId = (
      rawPayload.id ??
      rawPayload.event_id ??
      rawPayload.webhook_id ??
      // Fallback: hash of event type + phone + timestamp
      crypto
        .createHash('sha256')
        .update(`${rawEventType}:${customerPhone}:${rawPayload.created_at ?? Date.now()}`)
        .digest('hex')
        .slice(0, 16)
    ) as string;

    return {
      eventType,
      posEventId,
      branchId,
      customerPhone,
      customerName,
      orderId,
      appointmentDate,
      doctorName,
      productName,
      rawPayload,
    };
  } catch (error) {
    console.error('[POS] Failed to normalize webhook payload:', error);
    return null;
  }
}

// ─────────────────────────────────────────────
// API Mode — Poll POS for recent events
// Pulls events since last poll using the POS REST API
// ─────────────────────────────────────────────

export interface PosApiConfig {
  baseUrl: string;
  apiKey: string;
  branchId: string;
}

export async function pollPosEvents(
  config: PosApiConfig,
  since?: Date
): Promise<NormalizedPosEvent[]> {
  try {
    const sinceParam = since
      ? `?since=${since.toISOString()}`
      : '?since=' + new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Last 5 mins default

    const response = await fetch(`${config.baseUrl}/events${sinceParam}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
        'X-Branch-ID': config.branchId,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POS API responded ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Handle both array response and { events: [...] } wrapper
    const events: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : (data.events ?? data.data ?? []);

    const normalized: NormalizedPosEvent[] = [];
    for (const event of events) {
      const norm = normalizeWebhookPayload(event, config.branchId);
      if (norm) normalized.push({ ...norm, rawPayload: { ...norm.rawPayload, _source: 'API_POLL' } });
    }

    return normalized;
  } catch (error) {
    console.error(`[POS] API poll failed for branch ${config.branchId}:`, error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Test POS Connection
// ─────────────────────────────────────────────

export async function testPosConnection(
  baseUrl: string,
  apiKey: string
): Promise<{ success: boolean; error?: string; branchName?: string }> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: `POS returned ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      branchName: data.branch_name ?? data.name ?? 'Connected',
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
