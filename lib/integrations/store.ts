import prisma from "@/lib/db";
import { auditEvent } from "@/lib/audit";
import { decryptSecret, encryptSecret, hasIntegrationEncryptionKey } from "./crypto";
import type { ConnectionStatus, ProviderId, PublicConnection } from "./types";

export function googleConfigured(): boolean {
  return Boolean(
    (process.env.GOOGLE_OPERATOR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
      (process.env.GOOGLE_OPERATOR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET) &&
      hasIntegrationEncryptionKey(),
  );
}

export function bingConfigured(): boolean {
  return Boolean(
    process.env.BING_WEBMASTER_CLIENT_ID &&
      process.env.BING_WEBMASTER_CLIENT_SECRET &&
      hasIntegrationEncryptionKey(),
  );
}

export function providerConfigured(provider: ProviderId): boolean {
  return provider === "google" ? googleConfigured() : bingConfigured();
}

export function toPublicConnection(row: {
  provider: string;
  status: string;
  accountEmail: string | null;
  scopes: string | null;
  selectedProperty: string | null;
  ga4PropertyId: string | null;
  ga4MeasurementId: string | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  lastErrorCode: string | null;
  lastErrorSafe: string | null;
  lastLatencyMs: number | null;
  tokenExpiresAt: Date | null;
} | null, provider: ProviderId): PublicConnection {
  const configured = providerConfigured(provider);
  if (!row) {
    return {
      provider,
      status: configured ? "AUTH_REQUIRED" : "NOT_CONFIGURED",
      accountEmail: null,
      scopes: null,
      selectedProperty: null,
      ga4PropertyId: null,
      ga4MeasurementId: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      consecutiveFailures: 0,
      lastErrorCode: null,
      lastErrorSafe: configured ? null : "Set Production-only operator OAuth env vars, then Connect.",
      lastLatencyMs: null,
      tokenExpiresAt: null,
      configured,
    };
  }
  return {
    provider,
    status: row.status as ConnectionStatus,
    accountEmail: row.accountEmail,
    scopes: row.scopes,
    selectedProperty: row.selectedProperty,
    ga4PropertyId: row.ga4PropertyId,
    ga4MeasurementId: row.ga4MeasurementId,
    lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
    lastFailureAt: row.lastFailureAt?.toISOString() ?? null,
    consecutiveFailures: row.consecutiveFailures,
    lastErrorCode: row.lastErrorCode,
    lastErrorSafe: row.lastErrorSafe,
    lastLatencyMs: row.lastLatencyMs,
    tokenExpiresAt: row.tokenExpiresAt?.toISOString() ?? null,
    configured,
  };
}

export async function getConnection(provider: ProviderId) {
  return prisma.operatorConnection.findUnique({ where: { provider } });
}

export async function getPublicConnection(provider: ProviderId): Promise<PublicConnection> {
  const row = await getConnection(provider);
  return toPublicConnection(row, provider);
}

export async function upsertTokens(opts: {
  provider: ProviderId;
  userId: string;
  accountEmail?: string | null;
  accountSubject?: string | null;
  scopes?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresInSec?: number | null;
  selectedProperty?: string | null;
  ga4PropertyId?: string | null;
  ga4MeasurementId?: string | null;
}) {
  const existing = await getConnection(opts.provider);
  const accessTokenEnc = encryptSecret(opts.accessToken);
  const refreshTokenEnc = opts.refreshToken ? encryptSecret(opts.refreshToken) : undefined;
  const tokenExpiresAt = opts.expiresInSec
    ? new Date(Date.now() + Math.max(30, opts.expiresInSec - 60) * 1000)
    : existing?.tokenExpiresAt ?? null;
  const data = {
    status: "CONNECTED" as const,
    accountEmail: opts.accountEmail ?? existing?.accountEmail ?? null,
    accountSubject: opts.accountSubject ?? existing?.accountSubject ?? null,
    scopes: opts.scopes ?? existing?.scopes ?? null,
    accessTokenEnc,
    ...(refreshTokenEnc ? { refreshTokenEnc } : existing?.refreshTokenEnc ? {} : { refreshTokenEnc: null }),
    tokenExpiresAt,
    selectedProperty: opts.selectedProperty ?? existing?.selectedProperty ?? null,
    ga4PropertyId: opts.ga4PropertyId ?? existing?.ga4PropertyId ?? null,
    ga4MeasurementId: opts.ga4MeasurementId ?? existing?.ga4MeasurementId ?? null,
    lastSuccessAt: new Date(),
    consecutiveFailures: 0,
    lastErrorCode: null,
    lastErrorSafe: null,
    connectedByUserId: opts.userId,
  };

  await prisma.operatorConnection.upsert({
    where: { provider: opts.provider },
    create: { provider: opts.provider, ...data },
    update: data,
  });

  await auditEvent({
    userId: opts.userId,
    action: "operator_integration_connected",
    metadata: JSON.stringify({ provider: opts.provider, email: opts.accountEmail ?? null }),
  });
}

export async function updateConnectionSelection(
  provider: ProviderId,
  patch: {
    selectedProperty?: string | null;
    ga4PropertyId?: string | null;
    ga4MeasurementId?: string | null;
  },
) {
  await prisma.operatorConnection.updateMany({
    where: { provider },
    data: {
      ...(patch.selectedProperty !== undefined ? { selectedProperty: patch.selectedProperty } : {}),
      ...(patch.ga4PropertyId !== undefined ? { ga4PropertyId: patch.ga4PropertyId } : {}),
      ...(patch.ga4MeasurementId !== undefined ? { ga4MeasurementId: patch.ga4MeasurementId } : {}),
    },
  });
}

export async function recordSuccess(provider: ProviderId, latencyMs?: number) {
  await prisma.operatorConnection.updateMany({
    where: { provider },
    data: {
      lastSuccessAt: new Date(),
      consecutiveFailures: 0,
      lastErrorCode: null,
      lastErrorSafe: null,
      lastLatencyMs: latencyMs ?? null,
      status: "CONNECTED",
    },
  });
}

export async function recordFailure(
  provider: ProviderId,
  code: string,
  safeMessage: string,
  status?: ConnectionStatus,
) {
  const row = await getConnection(provider);
  await prisma.operatorConnection.upsert({
    where: { provider },
    create: {
      provider,
      status: status ?? "SYNC_FAILED",
      consecutiveFailures: 1,
      lastFailureAt: new Date(),
      lastErrorCode: code,
      lastErrorSafe: safeMessage,
    },
    update: {
      status: status ?? (row?.status === "CONNECTED" ? "SYNC_FAILED" : row?.status ?? "SYNC_FAILED"),
      consecutiveFailures: { increment: 1 },
      lastFailureAt: new Date(),
      lastErrorCode: code,
      lastErrorSafe: safeMessage,
    },
  });
}

export async function readAccessToken(provider: ProviderId): Promise<string | null> {
  const row = await getConnection(provider);
  if (!row?.accessTokenEnc) return null;
  return decryptSecret(row.accessTokenEnc);
}

export async function readRefreshToken(provider: ProviderId): Promise<string | null> {
  const row = await getConnection(provider);
  if (!row?.refreshTokenEnc) return null;
  return decryptSecret(row.refreshTokenEnc);
}

export async function disconnect(provider: ProviderId, userId: string) {
  await prisma.operatorConnection.upsert({
    where: { provider },
    create: { provider, status: "AUTH_REQUIRED" },
    update: {
      status: "AUTH_REQUIRED",
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      accountEmail: null,
      accountSubject: null,
      scopes: null,
      lastErrorSafe: "Disconnected by operator.",
      lastErrorCode: "DISCONNECTED",
    },
  });
  await prisma.operatorSnapshot.deleteMany({ where: { provider } });
  await auditEvent({
    userId,
    action: "operator_integration_disconnected",
    metadata: JSON.stringify({ provider }),
  });
}

export async function saveSnapshot(provider: ProviderId, dataset: string, rangeKey: string, state: string, payload: unknown) {
  await prisma.operatorSnapshot.create({
    data: { provider, dataset, rangeKey, state, payload: payload as object, source: provider, fetchedAt: new Date() },
  });
}

export async function latestSnapshot<T>(provider: ProviderId, dataset: string, rangeKey: string, maxAgeMs = 15 * 60 * 1000) {
  const row = await prisma.operatorSnapshot.findFirst({
    where: { provider, dataset, rangeKey },
    orderBy: { fetchedAt: "desc" },
  });
  if (!row) return null;
  if (Date.now() - row.fetchedAt.getTime() > maxAgeMs) return null;
  return { state: row.state, payload: row.payload as T, fetchedAt: row.fetchedAt.toISOString() };
}
