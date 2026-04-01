/**
 * @deprecated Use `useEvmWallet` hook from `@/hooks/useEvmWallet` instead.
 * This file is kept only for backward compatibility with non-hook contexts.
 */

export async function getEvmAddress(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { getAccount } = await import("wagmi/actions");
    const { wagmiConfig } = await import("@/config/wagmiConfig");
    const account = getAccount(wagmiConfig);
    return account.address ?? null;
  } catch {
    return null;
  }
}

export async function getEvmProviderRaw(): Promise<{
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
} | null> {
  if (typeof window === "undefined") return null;
  try {
    const { getConnectorClient } = await import("wagmi/actions");
    const { wagmiConfig } = await import("@/config/wagmiConfig");
    const client = await getConnectorClient(wagmiConfig);
    return client.transport as {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  } catch {
    return null;
  }
}
