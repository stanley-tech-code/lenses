
const AUTH_STORAGE_KEY = 'auth_token';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branch: {
    id: string;
    name: string;
  };
  [key: string]: unknown;
}

class AuthClient {
  private token: string | null = null;
  private user: UserProfile | null = null;

  constructor() {
    if (globalThis.window !== undefined) {
      this.token = localStorage.getItem(AUTH_STORAGE_KEY);
    }
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get the current token
  getToken(): string | null {
    return this.token;
  }

  // Get auth headers for API requests
  getAuthHeaders(): HeadersInit {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // Login
  async signIn(email: string, password: string): Promise<{ error?: string }> {
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || 'Login failed' };
      }

      this.setSession(data.token, data.user);
      return {};
    } catch {
      return { error: 'Network error' };
    }
  }

  async signInWithPassword(params: { email: string; password: string }): Promise<{ error?: string }> {
    return this.signIn(params.email, params.password);
  }

  // Register
  async signUp(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    branchId: string;
  }): Promise<{ error?: string }> {
    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || 'Registration failed' };
      }

      this.setSession(data.token, data.user);
      return {};
    } catch {
      return { error: 'Network error' };
    }
  }

  // Reset Password (stub)
  async resetPassword(payload: { email: string }): Promise<{ error?: string }> {
    try {
      // TODO: Implement API endpoint
      // const res = await fetch('/api/auth/reset-password', ...);
      console.log('Reset password for:', payload.email);
      return {};
    } catch {
      return { error: 'Network error' };
    }
  }

  // Logout
  async signOut(): Promise<{ error?: string }> {
    this.token = null;
    this.user = null;
    if (globalThis.window !== undefined) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // Optional: Call API to invalidate cookie if used
    }
    globalThis.window.location.href = '/auth/sign-in';
    return {};
  }

  // Get user profile
  async getUser(): Promise<{ data: UserProfile | null; error?: string }> {
    return { data: this.user };
  }

  // Initialize session (e.g. on app load)
  async init(): Promise<void> {
    if (!this.token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
      } else {
        // Token invalid/expired
        this.signOut();
      }
    } catch {
      // Network error, keep token but no user data updated
    }
  }

  private setSession(token: string, user: UserProfile) {
    this.token = token;
    this.user = user;
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  }
}

export const authClient = new AuthClient();
