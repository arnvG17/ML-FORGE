export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("forge_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("forge_token", token);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("forge_token");
  localStorage.removeItem("forge_user_email");
  localStorage.removeItem("forge_user_name");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
