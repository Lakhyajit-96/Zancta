import type { PaymentProvider, ProviderName } from "./types";
import { DodoProvider } from "./providers/dodo";

let _instance: PaymentProvider | null = null;

export function getPaymentProvider(name?: ProviderName): PaymentProvider {
  const providerName = (name || (process.env.PAYMENTS_PROVIDER as ProviderName) || "dodo") as ProviderName;
  if (providerName === "dodo") {
    if (!_instance || _instance.name !== "dodo") _instance = new DodoProvider();
    return _instance;
  }
  // Future: paddle
  if (providerName === "paddle") {
    throw new Error("Paddle provider not yet configured — set PAYMENTS_PROVIDER=dodo");
  }
  throw new Error(`Unknown payment provider: ${providerName}`);
}

export function getActiveProviderName(): ProviderName {
  return (process.env.PAYMENTS_PROVIDER as ProviderName) || "dodo";
}

export * from "./types";
export { isLivePaymentsEnabled } from "./live";
