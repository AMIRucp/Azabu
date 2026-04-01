import { z } from 'zod';
import { insertUserSchema, insertTransactionSchema, users, transactions } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:walletAddress' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    createOrUpdate: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  chat: {
    send: {
      method: 'POST' as const,
      path: '/api/chat' as const,
      input: z.object({
        message: z.string(),
        walletAddress: z.string().optional(),
        conversationHistory: z.array(z.object({
          role: z.string(),
          content: z.string(),
        })).optional(),
        activeChain: z.enum(['solana']).optional(),
      }),
      responses: {
        200: z.object({
          reply: z.string(),
          intent: z.any().optional(),
          quote: z.any().optional(),
          safetyData: z.any().optional(),
          holdings: z.any().optional(),
          priceData: z.any().optional(),
          ordersData: z.any().optional(),
          limitOrderData: z.any().optional(),
          launchData: z.any().optional(),
          sendData: z.any().optional(),
          perpsData: z.any().optional(),
          dcaData: z.any().optional(),
          newTokensData: z.any().optional(),
          payData: z.any().optional(),
          alertData: z.any().optional(),
          tokenInfoData: z.any().optional(),
          basketData: z.any().optional(),
          lendData: z.any().optional(),
          triggerOrderData: z.any().optional(),
          marketData: z.any().optional(),
          contactsData: z.any().optional(),
          helpData: z.any().optional(),
          equitiesData: z.any().optional(),
          bonkLaunchData: z.any().optional(),
          rwaData: z.any().optional(),
          newsData: z.any().optional(),
          bridgeData: z.any().optional(),
          citations: z.array(z.string()).optional(),
          suggestions: z.array(z.string()).optional(),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions/by-wallet/:walletAddress' as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions' as const,
      input: insertTransactionSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/transactions/:id/status' as const,
      input: z.object({
        status: z.string(),
        signature: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
