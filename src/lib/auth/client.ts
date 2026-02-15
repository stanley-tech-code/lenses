import { JwtPayload } from './middleware';

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
}

class AuthClient {
  private token: string | null = null;
  private user: UserProfile | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
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
    } catch (err) {
      return { error: 'Network error' };
    }
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
    } catch (err) {
      return { error: 'Network error' };
    }
  }

  // Logout
  async signOut(): Promise<void> {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // Optional: Call API to invalidate cookie if used
    }
    window.location.href = '/auth/sign-in';
  }

  // Get user profile
  getUser(): UserProfile | null {
    return this.user;
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
