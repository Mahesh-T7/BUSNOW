/**
 * api.ts — Centralised HTTP + Socket.io client for VaradTrack
 *
 * Usage:
 *   import { api, socket } from "@/lib/api";
 *   const { token, user } = await api.login(email, password, role);
 */

import { io, Socket } from "socket.io-client";

// In production (Vercel): API lives on the same domain → use '' (same origin)
// In local dev: point to the separate Node server on port 5000
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:5000");

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem("vt_token");
export const setToken = (t: string) => localStorage.setItem("vt_token", t);
export const removeToken = () => {
  localStorage.removeItem("vt_token");
  localStorage.removeItem("vt_role");
  localStorage.removeItem("vt_email");
};

// ─── Base fetch wrapper ───────────────────────────────────────────────────────
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "passenger" | "driver" | "admin";
  busId?: string | null;
  assignedRoute?: string | null;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export const api = {
  // Login
  async login(email: string, password: string, role?: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    setToken(data.token);
    localStorage.setItem("vt_role", data.user.role);
    localStorage.setItem("vt_email", data.user.email);
    return data;
  },

  // Register
  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    busId?: string;
    assignedRoute?: string;
    licenseNumber?: string;
  }): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    localStorage.setItem("vt_role", data.user.role);
    localStorage.setItem("vt_email", data.user.email);
    return data;
  },

  // Get current user
  async me(): Promise<AuthUser> {
    const data = await request<{ success: boolean; user: AuthUser }>("/api/auth/me");
    return data.user;
  },

  // Logout
  logout() {
    removeToken();
  },

  // ── Buses ────────────────────────────────────────────────────────────────
  async getBuses() {
    return request<{ success: boolean; buses: LiveBus[] }>("/api/buses");
  },

  async getBus(sessionId: string) {
    return request<{ success: boolean; bus: LiveBus }>(`/api/buses/${sessionId}`);
  },

  // ── Driver ───────────────────────────────────────────────────────────────
  async startSession(payload: {
    busId: string;
    route: string;
    routeName: string;
    crowdLevel?: string;
  }) {
    return request<{ success: boolean; session: { _id: string } }>("/api/driver/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateLocation(payload: {
    sessionId: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    crowdLevel?: string;
  }) {
    return request("/api/driver/location", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async stopSession(sessionId: string) {
    return request("/api/driver/stop", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  },

  async getDriverSession() {
    return request<{ success: boolean; session: DriverSession | null }>("/api/driver/session");
  },

  async getDriverHistory() {
    return request<{ success: boolean; sessions: DriverSession[] }>("/api/driver/history");
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  async getAdminStats() {
    return request<{ success: boolean; stats: AdminStats }>('/api/admin/stats');
  },

  async getAdminUsers(params?: { role?: string; search?: string; page?: number }) {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ success: boolean; users: AuthUser[]; pagination: Pagination }>(
      `/api/admin/users${q ? `?${q}` : ''}`
    );
  },

  async updateAdminUser(id: string, data: Partial<AuthUser>) {
    return request<{ success: boolean; user: AuthUser }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminUser(id: string) {
    return request(`/api/admin/users/${id}`, { method: 'DELETE' });
  },

  // ── Admin: Buses ─────────────────────────────────────────────────────────
  async getAdminBuses() {
    return request<{ success: boolean; buses: any[] }>('/api/admin/buses');
  },

  async createAdminBus(data: any) {
    return request<{ success: boolean; bus: any }>('/api/admin/buses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminBus(id: string, data: any) {
    return request<{ success: boolean; bus: any }>(`/api/admin/buses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminBus(id: string) {
    return request(`/api/admin/buses/${id}`, { method: 'DELETE' });
  },

  // ── Admin: Routes ────────────────────────────────────────────────────────
  async getAdminRoutes() {
    return request<{ success: boolean; routes: any[] }>('/api/admin/routes');
  },

  async createAdminRoute(data: any) {
    return request<{ success: boolean; route: any }>('/api/admin/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminRoute(id: string, data: any) {
    return request<{ success: boolean; route: any }>(`/api/admin/routes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminRoute(id: string) {
    return request(`/api/admin/routes/${id}`, { method: 'DELETE' });
  },

  // ── Admin: Schedules ─────────────────────────────────────────────────────
  async getAdminSchedules() {
    return request<{ success: boolean; schedules: any[] }>('/api/admin/schedules');
  },

  async createAdminSchedule(data: any) {
    return request<{ success: boolean; schedule: any }>('/api/admin/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminSchedule(id: string, data: any) {
    return request<{ success: boolean; schedule: any }>(`/api/admin/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminSchedule(id: string) {
    return request(`/api/admin/schedules/${id}`, { method: 'DELETE' });
  },

  // ── Admin: Drivers ────────────────────────────────────────────────────────
  async getAdminDrivers(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; drivers: any[] }>(`/api/admin/drivers${q}`);
  },

  async createAdminDriver(data: any) {
    return request<{ success: boolean; driver: any; driverId: string; generatedPassword: string }>(
      '/api/admin/drivers',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  async updateAdminDriver(id: string, data: any) {
    return request<{ success: boolean; driver: any }>(`/api/admin/drivers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminDriver(id: string) {
    return request(`/api/admin/drivers/${id}`, { method: 'DELETE' });
  },

  async seedDemo() {
    return request('/api/admin/seed', { method: 'POST' });
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LiveBus {
  id: string;
  sessionId: string;
  route: string;
  routeName: string;
  lat: number | null;
  lng: number | null;
  speed: number;
  heading: number;
  crowd: "Low" | "Medium" | "High";
  driver: string;
  startedAt?: string;
}

export interface DriverSession {
  _id: string;
  busId: string;
  route: string;
  routeName: string;
  crowdLevel: string;
  lat: number | null;
  lng: number | null;
  speed: number;
  isActive: boolean;
  startedAt: string;
  endedAt: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalPassengers: number;
  activeBuses: number;
  totalSessions: number;
  sessionsToday: number;
}

export interface AdminDriver {
  _id: string;
  name: string;
  email: string;
  busId: string | null;
  assignedRoute: string | null;
  status: "Active" | "Offline";
  currentSession: DriverSession | null;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

// ─── Socket.io Client ─────────────────────────────────────────────────────────
let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    // On Vercel the socket.io server lives at /api/socket.io (same origin)
    // On local dev it lives at http://localhost:5000
    const socketPath = import.meta.env.PROD ? "/api/socket.io" : "/socket.io";

    _socket = io(BASE_URL || window.location.origin, {
      auth: { token: getToken() },
      // polling first for Vercel serverless compatibility; websocket as upgrade
      transports: ["polling", "websocket"],
      path: socketPath,
      autoConnect: false,
    });

    _socket.on("connect", () =>
      console.log("[Socket] connected:", _socket!.id)
    );
    _socket.on("disconnect", (reason) =>
      console.log("[Socket] disconnected:", reason)
    );
    _socket.on("connect_error", (err) =>
      console.warn("[Socket] error:", err.message)
    );
  }
  return _socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    // Update token in case it changed
    s.auth = { token: getToken() };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (_socket?.connected) _socket.disconnect();
  _socket = null;
}
