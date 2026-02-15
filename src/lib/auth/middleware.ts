/**
 * JWT Auth Middleware Helper
 * Use this in every protected API route
 */

import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-this-secret-in-production');

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'STAFF';
  branchId: string | null;
}

export async function verifyAuth(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : request.cookies.get('auth-token')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 });
}

// Ensures SUPER_ADMIN and BRANCH_ADMIN have branchId access
export function canAccessBranch(auth: JwtPayload, branchId: string): boolean {
  if (auth.role === 'SUPER_ADMIN') return true;
  return auth.branchId === branchId;
}
