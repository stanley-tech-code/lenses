import { NextResponse } from 'next/server';
import { db } from '@/lib/db-utils';
import dayjs from 'dayjs';

export async function GET() {
  try {
    const data = db.read();
    return NextResponse.json(data.templates);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, triggerEvent } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'AUTOMATIC' && !triggerEvent) {
      return NextResponse.json({ error: 'Trigger event is required for automatic templates' }, { status: 400 });
    }

    const currentData = db.read();

    const newTemplate = {
      ...body,
      id: crypto.randomUUID(),
      status: 'ACTIVE',
      createdAt: dayjs().toISOString(),
    };

    currentData.templates.push(newTemplate);
    db.write(currentData);

    return NextResponse.json(newTemplate, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
