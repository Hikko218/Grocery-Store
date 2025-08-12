// Utility for checking authentication status of the current user
export type AuthStatus = {
  isAuthenticated: boolean;
  userId?: number;
  email?: string;
  role?: string;
};

export async function getAuthStatus(): Promise<AuthStatus> {
  const candidates = ["/api/auth/status"];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        return {
          isAuthenticated: true,
          userId: data.userId ?? data.id,
          email: data.email,
          role: data.role,
        };
      }
    } catch {
      // ignore
    }
  }
  return { isAuthenticated: false };
}
