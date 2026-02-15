/**
 * Automation Engine
 * Baus Optical — Lenses Platform
 *
 * This is the brain of the system.
 * When a POS event arrives (via webhook or API poll), this engine:
 * 1. Finds or creates the customer in our DB
 * 2. Finds the matching active template for that event
 * 3. Renders the template with the customer's variables
 * 4. Schedules or immediately sends the SMS
 * 5. Logs everything to SmsLog
 */

import { PrismaClient } from '@prisma/client';
import type { NormalizedPosEvent } from './integration';
import { sendSms, renderTemplate, type SmsConfig } from '../sms/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Process a single POS event end-to-end
// ─────────────────────────────────────────────

export async function processPosEvent(event: NormalizedPosEvent): Promise<{
  success: boolean;
  smsLogId?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}> {
  const { branchId, eventType, customerPhone, customerName, orderId, appointmentDate, posEventId } = event;

  try {
    // ── 1. Deduplication check ──
    const alreadyProcessed = await prisma.posEvent.findUnique({
      where: { branchId_posEventId: { branchId, posEventId } },
    });

    if (alreadyProcessed?.processed) {
      return { success: true, skipped: true, reason: 'Already processed' };
    }

    // ── 2. Store raw event ──
    const storedEvent = await prisma.posEvent.upsert({
      where: { branchId_posEventId: { branchId, posEventId } },
      update: {},
      create: {
        branchId,
        eventType,
        posEventId,
        source: (event.rawPayload._source as 'WEBHOOK' | 'API_POLL') ?? 'WEBHOOK',
        rawPayload: event.rawPayload,
        customerPhone,
        customerName,
        orderId: orderId ?? null,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      },
    });

    // ── 3. Get branch config ──
    const posConfig = await prisma.posConfig.findUnique({
      where: { branchId },
      include: { branch: true },
    });

    if (!posConfig) {
      await markEventFailed(storedEvent.id, 'Branch POS config not found');
      return { success: false, error: 'Branch config not found' };
    }

    if (!posConfig.automationEnabled) {
      await prisma.posEvent.update({
        where: { id: storedEvent.id },
        data: { processed: true, processedAt: new Date(), error: 'Automation disabled' },
      });
      return { success: true, skipped: true, reason: 'Automation disabled for branch' };
    }

    // ── 4. Find or create customer ──
    let customer = await prisma.customer.findUnique({
      where: { branchId_phone: { branchId, phone: normalizePhone(customerPhone) } },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          branchId,
          name: customerName,
          phone: normalizePhone(customerPhone),
          source: 'POS',
          posCustomerId: posEventId,
        },
      });
    }

    // ── 5. Check opt-out ──
    if (customer.optedOut) {
      await prisma.posEvent.update({
        where: { id: storedEvent.id },
        data: { processed: true, processedAt: new Date(), smsTriggered: false },
      });
      return { success: true, skipped: true, reason: 'Customer opted out' };
    }

    // ── 6. Update customer last event timestamps ──
    const customerUpdate: Record<string, Date> = {};
    if (eventType === 'AFTER_VISIT') customerUpdate.lastVisitAt = new Date();
    if (eventType === 'AFTER_PURCHASE') customerUpdate.lastPurchaseAt = new Date();
    if (Object.keys(customerUpdate).length > 0) {
      await prisma.customer.update({ where: { id: customer.id }, data: customerUpdate });
    }

    // ── 7. Find matching active template ──
    const template = await prisma.template.findFirst({
      where: {
        triggerEvent: eventType as never,
        status: 'ACTIVE',
        type: 'AUTOMATIC',
      },
      orderBy: { updatedAt: 'desc' }, // Most recently updated wins
    });

    if (!template) {
      await prisma.posEvent.update({
        where: { id: storedEvent.id },
        data: { processed: true, processedAt: new Date(), error: `No active template for ${eventType}` },
      });
      return { success: true, skipped: true, reason: `No active template for event: ${eventType}` };
    }

    // ── 8. Render the message with real variables ──
    const renderedMessage = renderTemplate(template.message, {
      customer_name: customerName,
      order_id: orderId,
      branch_name: posConfig.branch.name,
      appointment_date: appointmentDate
        ? new Date(appointmentDate).toLocaleDateString('en-KE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })
        : undefined,
      opt_out_keyword: posConfig.optOutKeyword,
    });

    // ── 9. Calculate send time (apply delay) ──
    let sendAt = new Date();
    if (template.delayValue && template.delayUnit) {
      sendAt = addDelay(sendAt, template.delayValue, template.delayUnit);
    }

    const isImmediate = sendAt <= new Date(Date.now() + 30_000); // Within 30 seconds = immediate

    // ── 10. Send or schedule ──
    if (isImmediate) {
      // Send now
      const smsConfig = buildSmsConfig(posConfig);
      const result = await sendSms({ to: customer.phone, message: renderedMessage }, smsConfig);

      const smsLog = await prisma.smsLog.create({
        data: {
          branchId,
          customerId: customer.id,
          templateId: template.id,
          phone: customer.phone,
          message: renderedMessage,
          provider: posConfig.smsProvider,
          providerMsgId: result.providerMsgId ?? null,
          status: result.success ? 'SENT' : 'FAILED',
          errorMessage: result.error ?? null,
          statusUpdatedAt: new Date(),
        },
      });

      await prisma.posEvent.update({
        where: { id: storedEvent.id },
        data: { processed: true, processedAt: new Date(), smsTriggered: true },
      });

      return { success: result.success, smsLogId: smsLog.id, error: result.error };
    } else {
      // Schedule for later — create a pending Reminder
      const reminder = await prisma.reminder.create({
        data: {
          branchId,
          customerId: customer.id,
          templateId: template.id,
          type: eventType,
          relatedEvent: orderId ? `Order #${orderId}` : eventType,
          scheduledAt: sendAt,
          status: 'PENDING',
        },
      });

      await prisma.posEvent.update({
        where: { id: storedEvent.id },
        data: { processed: true, processedAt: new Date(), smsTriggered: false },
      });

      return { success: true, skipped: false, reason: `Scheduled for ${sendAt.toISOString()} (reminder: ${reminder.id})` };
    }
  } catch (error) {
    console.error('[AutomationEngine] Failed to process event:', error);
    return { success: false, error: String(error) };
  }
}

// ─────────────────────────────────────────────
// Process due reminders (run via cron / scheduler)
// Call this every minute from a cron job or Vercel cron
// ─────────────────────────────────────────────

export async function processDueReminders(): Promise<void> {
  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
    },
    include: {
      customer: true,
      template: true,
      branch: {
        include: { posConfig: true },
      },
    },
    take: 50, // Process in batches
  });

  console.log(`[Scheduler] Processing ${dueReminders.length} due reminders`);

  for (const reminder of dueReminders) {
    if (!reminder.branch.posConfig || reminder.customer.optedOut) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: reminder.customer.optedOut ? 'SKIPPED' : 'FAILED',
          error: reminder.customer.optedOut ? 'Customer opted out' : 'No SMS config',
        },
      });
      continue;
    }

    const renderedMessage = renderTemplate(reminder.template.message, {
      customer_name: reminder.customer.name,
      branch_name: reminder.branch.name,
      opt_out_keyword: reminder.branch.posConfig.optOutKeyword,
    });

    const smsConfig = buildSmsConfig(reminder.branch.posConfig);
    const result = await sendSms({ to: reminder.customer.phone, message: renderedMessage }, smsConfig);

    await prisma.smsLog.create({
      data: {
        branchId: reminder.branchId,
        customerId: reminder.customerId,
        templateId: reminder.templateId,
        phone: reminder.customer.phone,
        message: renderedMessage,
        provider: reminder.branch.posConfig.smsProvider,
        providerMsgId: result.providerMsgId ?? null,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error ?? null,
        statusUpdatedAt: new Date(),
      },
    });

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        error: result.error ?? null,
      },
    });
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    return '+254' + cleaned.slice(1);
  }
  if (cleaned.startsWith('254') && !cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
}

function addDelay(date: Date, value: number, unit: string): Date {
  const d = new Date(date);
  switch (unit) {
    case 'MINUTES': d.setMinutes(d.getMinutes() + value); break;
    case 'HOURS':   d.setHours(d.getHours() + value); break;
    case 'DAYS':    d.setDate(d.getDate() + value); break;
    case 'WEEKS':   d.setDate(d.getDate() + value * 7); break;
    case 'MONTHS':  d.setMonth(d.getMonth() + value); break;
  }
  return d;
}

function buildSmsConfig(posConfig: {
  smsProvider: string;
  smsApiKey: string | null;
  smsUsername: string | null;
  smsSenderId: string | null;
}): SmsConfig {
  return {
    provider: posConfig.smsProvider as SmsConfig['provider'],
    apiKey: posConfig.smsApiKey ?? '',
    username: posConfig.smsUsername ?? undefined,
    senderId: posConfig.smsSenderId ?? 'BausOptical',
  };
}

async function markEventFailed(eventId: string, error: string): Promise<void> {
  await prisma.posEvent.update({
    where: { id: eventId },
    data: { processed: true, processedAt: new Date(), error },
  });
}
