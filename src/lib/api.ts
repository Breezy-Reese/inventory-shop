/**
 * Typed REST client. All requests go to `${API_BASE}` — set VITE_API_URL
 * to point at your backend (defaults to same-origin `/api`).
 *
 * Expected endpoints (implement these on your backend):
 *   POST   /auth/login              { email, password } -> { token, user }
 *   POST   /auth/register           { name, email, password } -> { token, user }
 *   GET    /products                -> Product[]
 *   POST   /products                -> Product
 *   PUT    /products/:id            -> Product
 *   DELETE /products/:id
 *   GET    /categories | POST /categories | DELETE /categories/:id
 *   GET    /suppliers  | POST /suppliers  | DELETE /suppliers/:id
 *   GET    /customers  | POST /customers  | DELETE /customers/:id
 *   GET    /inventory               -> InventoryItem[]
 *   GET    /inventory/movements     -> StockMovement[]
 *   POST   /inventory/adjustments   { productId, quantity, reason }
 *   GET    /purchases | POST /purchases | POST /purchases/:id/receive
 *   GET    /sales     | POST /sales
 *   GET    /reports/summary         -> DashboardSummary
 *   GET    /reports/sales?from&to   -> RevenuePoint[]
 *   GET    /reports/profit?from&to  -> ProfitPoint[]
 *   GET    /reports/inventory       -> InventoryItem[]
 *   GET    /reports/expenses?from&to-> Expense[]
 *   GET    /settings  | PUT /settings
 *   GET    /audit-logs              -> AuditLog[]
 */

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

const TOKEN_KEY = "pos_token";
const USER_KEY = "pos_user";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "API unreachable — connect your backend to power this screen.");
  }

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
