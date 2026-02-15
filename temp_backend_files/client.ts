/**
 * SMS Provider Abstraction Layer
 * Baus Optical — Lenses Platform
 *
 * Supports: Africa's Talking, Twilio, VeriSend (custom)
 * Each branch can have its own provider configured via PosConfig
 */

export interface SmsResult {
  success: boolean;
  providerMsgId?: string;
  error?: string;
  cost?: number;
}

export interface SmsSendParams {
  to: string;         // E.164 format e.g. +254712345678
  message: string;
  senderId?: string;  // Override sender ID
}

// ─────────────────────────────────────────────
// Africa's Talking
// ─────────────────────────────────────────────

async function sendViaAfricasTalking(
  params: SmsSendParams,
  apiKey: string,
  username: string,
  senderId?: string
): Promise<SmsResult> {
  try {
    const body = new URLSearchParams({
      username,
      to: params.to,
      message: params.message,
      ...(senderId && { from: senderId }),
    });

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey,
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (data.SMSMessageData?.Recipients?.[0]) {
      const recipient = data.SMSMessageData.Recipients[0];
      if (recipient.status === 'Success') {
        return {
          success: true,
          providerMsgId: recipient.messageId,
          cost: parseFloat(recipient.cost?.replace('KES ', '') ?? '0'),
        };
      }
      return { success: false, error: recipient.status };
    }

    return { success: false, error: 'Unknown response from Africa\'s Talking' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─────────────────────────────────────────────
// Twilio
// ─────────────────────────────────────────────

async function sendViaTwilio(
  params: SmsSendParams,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<SmsResult> {
  try {
    const body = new URLSearchParams({
      To: params.to,
      From: params.senderId ?? fromNumber,
      Body: params.message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    const data = await response.json();

    if (data.sid && data.status !== 'failed') {
      return { success: true, providerMsgId: data.sid };
    }

    return { success: false, error: data.message ?? 'Twilio error' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─────────────────────────────────────────────
// VeriSend (custom/generic REST provider)
// ─────────────────────────────────────────────

async function sendViaVeriSend(
  params: SmsSendParams,
  apiKey: string,
  senderId?: string
): Promise<SmsResult> {
  try {
    const response = await fetch('https://api.verisend.co.ke/v1/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.to,
        message: params.message,
        sender_id: senderId ?? 'BausOptical',
      }),
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, providerMsgId: data.message_id };
    }

    return { success: false, error: data.error ?? 'VeriSend error' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─────────────────────────────────────────────
// Template Variable Renderer
// ─────────────────────────────────────────────

export interface TemplateVariables {
  customer_name?: string;
  order_id?: string;
  branch_name?: string;
  appointment_date?: string;
  doctor_name?: string;
  product_name?: string;
  opt_out_keyword?: string;
}

export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      rendered = rendered.replaceAll(`{{${key}}}`, value);
    }
  }
  // Remove any unreplaced variables
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');
  return rendered.trim();
}

// ─────────────────────────────────────────────
// Main Send Function (routes to correct provider)
// ─────────────────────────────────────────────

export interface SmsConfig {
  provider: 'AFRICAS_TALKING' | 'TWILIO' | 'VERISEND' | 'CUSTOM';
  apiKey: string;
  username?: string;    // Africa's Talking
  accountSid?: string;  // Twilio
  authToken?: string;   // Twilio
  senderId?: string;
  fromNumber?: string;  // Twilio
}

export async function sendSms(params: SmsSendParams, config: SmsConfig): Promise<SmsResult> {
  // Normalize phone to E.164 for Kenya (+254)
  let phone = params.to.replace(/\s/g, '');
  if (phone.startsWith('07') || phone.startsWith('01')) {
    phone = '+254' + phone.slice(1);
  } else if (phone.startsWith('254')) {
    phone = '+' + phone;
  }
  const normalizedParams = { ...params, to: phone };

  switch (config.provider) {
    case 'AFRICAS_TALKING':
      return sendViaAfricasTalking(
        normalizedParams,
        config.apiKey,
        config.username ?? 'sandbox',
        config.senderId
      );

    case 'TWILIO':
      return sendViaTwilio(
        normalizedParams,
        config.accountSid ?? '',
        config.authToken ?? '',
        config.fromNumber ?? config.senderId ?? ''
      );

    case 'VERISEND':
    case 'CUSTOM':
      return sendViaVeriSend(normalizedParams, config.apiKey, config.senderId);

    default:
      return { success: false, error: 'No SMS provider configured' };
  }
}

// ─────────────────────────────────────────────
// Test Connection (send test SMS)
// ─────────────────────────────────────────────

export async function testSmsConnection(
  testPhone: string,
  config: SmsConfig,
  branchName: string
): Promise<SmsResult> {
  return sendSms(
    {
      to: testPhone,
      message: `✅ Lenses SMS test from ${branchName}. Your SMS integration is working correctly!`,
      senderId: config.senderId,
    },
    config
  );
}
