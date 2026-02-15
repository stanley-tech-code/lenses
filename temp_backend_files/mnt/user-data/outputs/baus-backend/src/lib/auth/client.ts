'use client';

/**
 * Real Auth Client — replaces the mock client
 * Connects to /api/auth/* endpoints
 */

import type { User } from '@/types/user';

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

class AuthClient {
  private getToken(): string | null {
    return localStorage.getItem('lenses-auth-token');
  }

  private setToken(token: string): void {
    localStorage.setItem('lenses-auth-token', token);
  }

  private clearToken(): void {
    localStorage.removeItem('lenses-auth-token');
    localStorage.removeItem('lenses-user');
  }

  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error ?? 'Sign-up failed' };
      }

      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error ?? 'Invalid credentials' };
      }

      this.setToken(data.token);
      localStorage.setItem('lenses-user', JSON.stringify(data.user));

      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented yet' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update password not implemented yet' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    try {
      const token = this.getToken();
      if (!token) return { data: null };

      // Try cached user first for instant load
      const cached = localStorage.getItem('lenses-user');
      if (cached) {
        const user = JSON.parse(cached);
        // Verify token is still valid in background
        this.verifyToken(token).then((valid) => {
          if (!valid) this.clearToken();
        });
        return { data: user };
      }

      // No cache — verify with server
      const valid = await this.verifyToken(token);
      if (!valid) {
        this.clearToken();
        return { data: null };
      }

      return { data: null };
    } catch {
      return { data: null };
    }
  }

  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('lenses-user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async signOut(): Promise<{ error?: string }> {
    this.clearToken();
    return {};
  }
}

export const authClient = new AuthClient();
