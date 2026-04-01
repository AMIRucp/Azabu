import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { 
  ChatResponse, 
  ParsedIntent 
} from "@shared/schema";

// Chat Hook
export function useChat() {
  return useMutation({
    mutationFn: async ({ message, walletAddress, conversationHistory }: { message: string; walletAddress?: string; conversationHistory?: Array<{ role: string; content: string }> }) => {
      const res = await fetch(api.chat.send.path, {
        method: api.chat.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, walletAddress, conversationHistory, activeChain: 'solana' }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      
      return res.json();
    },
  });
}

// User Hooks
export function useUser(walletAddress: string | null) {
  return useQuery({
    queryKey: [api.users.get.path, walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      const url = buildUrl(api.users.get.path, { walletAddress });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!walletAddress,
  });
}

export function useCreateOrUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { walletAddress: string; slippageTolerance?: number }) => {
      const res = await fetch(api.users.createOrUpdate.path, {
        method: api.users.createOrUpdate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user settings");
      return api.users.createOrUpdate.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path, variables.walletAddress] });
      toast({ title: "Settings updated", description: "Your preferences have been saved." });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save settings. Please try again.",
        variant: "destructive" 
      });
    }
  });
}

// Transaction Hooks
export function useTransactions(walletAddress: string | null) {
  return useQuery({
    queryKey: [api.transactions.list.path, walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const url = buildUrl(api.transactions.list.path, { walletAddress });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
    enabled: !!walletAddress,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.transactions.create.path, {
        method: api.transactions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record transaction");
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path, variables.walletAddress] });
    }
  });
}

