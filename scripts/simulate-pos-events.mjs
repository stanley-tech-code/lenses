
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

// Parse args
const args = process.argv.slice(2);
const help = args.includes('--help');
const eventArg = args.find(a => a.startsWith('--event'));
const phoneArg = args.find(a => a.startsWith('--phone'));

if (help || !phoneArg) {
  console.log(`
Usage: node scripts/simulate-pos-events.mjs --phone <PHONE> [--event <EVENT_TYPE>]

Options:
  --phone   Customer phone number (required)
  --event   Event type (default: AFTER_PURCHASE)
            Values: AFTER_PURCHASE, AFTER_VISIT, ORDER_COLLECTED, etc.
`);
  process.exit(0);
}

const phone = args[args.indexOf('--phone') + 1] || phoneArg.split('=')[1];
const eventType = (args.includes('--event') ? args[args.indexOf('--event') + 1] : null)
  || (eventArg ? eventArg.split('=')[1] : 'AFTER_PURCHASE');

async function main() {
  console.log(`\n--- Simulating POS Event: ${eventType} ---`);

  // 1. Get Config
  const config = await prisma.posConfig.findFirst({
    where: { branchId: 'default-branch-id' }
  });

  if (!config) {
    console.error('❌ No PosConfig found for default-branch-id. Run setup-pos-config.ts first.');
    process.exit(1);
  }

  // 2. Payload
  const payload = {
    event_type: eventType,
    event_id: `evt_${Date.now()}`,
    created_at: new Date().toISOString(),
    customer: {
      phone: phone,
      first_name: 'Simulated',
      last_name: 'User'
    },
    sale_id: `ord_${Math.floor(Math.random() * 10000)}`,
    amount: 5000
  };

  const payloadString = JSON.stringify(payload);

  // 3. Sign
  const signature = 'sha256=' + crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payloadString, 'utf8')
    .digest('hex');

  // 4. Send
  const url = 'http://localhost:3004/api/webhooks/pos';
  console.log(`Target: ${url}`);
  console.log(`Payload:`, payload);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Branch-ID': config.branchId,
        'X-Webhook-Signature': signature
      },
      body: payloadString
    });

    console.log(`\nResponse Status: ${res.status}`);
    const data = await res.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (res.ok) {
      console.log('\n✅ Event sent successfully!');
      console.log('Check the application logs for SMS sending status.');
    } else {
      console.log('\n❌ Event processing failed.');
    }

  } catch (e) {
    console.error('Network Error:', e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
