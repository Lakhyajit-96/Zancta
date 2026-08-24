export const DATA_STATES = [
  "DATA_AVAILABLE",
  "NO_DATA",
  "DATA_UNAVAILABLE",
  "AUTH_REQUIRED",
  "API_NOT_SUPPORTED",
  "PERMISSION_DENIED",
  "TOKEN_EXPIRED",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "PROPERTY_NOT_FOUND",
  "NOT_CONFIGURED",
  "PREVIEW_ISOLATED",
] as const;

export type DataState = (typeof DATA_STATES)[number];

export const CONNECTION_STATUSES = [
  "NOT_CONFIGURED",
  "AUTH_REQUIRED",
  "CONNECTED",
  "TOKEN_EXPIRED",
  "PERMISSION_DENIED",
  "SYNC_FAILED",
  "PREVIEW_ISOLATED",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export type ProviderId = "google" | "bing";

export type ApiResult<T> = {
  state: DataState;
  data: T | null;
  message: string;
  httpStatus?: number;
  providerCode?: string;
  fetchedAt?: string;
  latencyMs?: number;
};

export function ok<T>(data: T, extra?: Partial<ApiResult<T>>): ApiResult<T> {
  return { state: "DATA_AVAILABLE", data, message: "OK", ...extra };
}

export function empty<T>(message: string): ApiResult<T> {
  return { state: "NO_DATA", data: null, message };
}

export function fail<T>(state: DataState, message: string, extra?: Partial<ApiResult<T>>): ApiResult<T> {
  return { state, data: null, message, ...extra };
}

export function classifyHttp(status: number): DataState {
  if (status === 401) return "TOKEN_EXPIRED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 404) return "PROPERTY_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "PROVIDER_UNAVAILABLE";
  return "DATA_UNAVAILABLE";
}

export type PublicConnection = {
  provider: ProviderId;
  status: ConnectionStatus;
  accountEmail: string | null;
  scopes: string | null;
  selectedProperty: string | null;
  ga4PropertyId: string | null;
  ga4MeasurementId: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
  lastErrorCode: string | null;
  lastErrorSafe: string | null;
  lastLatencyMs: number | null;
  tokenExpiresAt: string | null;
  configured: boolean;
};

export type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscOverview = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  rows: GscRow[];
};

export type DateRange = { startDate: string; endDate: string; key: string };
