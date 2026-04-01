import { pgTable, text, serial, integer, timestamp, numeric, jsonb, boolean, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  slippageTolerance: integer("slippage_tolerance").default(50),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  type: text("type").notNull(),
  fromToken: text("from_token"),
  toToken: text("to_token"),
  amount: numeric("amount"),
  signature: text("signature"),
  status: text("status").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const copyTrades = pgTable("copy_trades", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  targetWallet: text("target_wallet").notNull(),
  scale: numeric("scale").default("1.0"),
  active: boolean("active").default(true),
  lastCheckedSig: text("last_checked_sig"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  photoUrl: text("photo_url"),
  authDate: integer("auth_date").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  avatarId: text("avatar_id").notNull(),
  email: text("email"),
  walletAddress: text("wallet_address"),
  telegramId: text("telegram_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const asterConnections = pgTable("aster_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  apiKeyEnc: text("api_key_enc").notNull(),
  apiSecretEnc: text("api_secret_enc").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  wallet: text("wallet").notNull(),
  protocol: text("protocol").notNull(),
  chain: text("chain").notNull(),
  market: text("market").notNull(),
  side: text("side").notNull(),
  sizeUsd: numeric("size_usd").notNull(),
  entryPrice: numeric("entry_price"),
  leverage: integer("leverage"),
  txSignature: text("tx_signature").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull().default(1),
  windowStart: timestamp("window_start").notNull().defaultNow(),
});

// Leaderboard: one row per wallet, upserted on each trade
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  callsign: text("callsign"),
  pfpId: text("pfp_id"),
  xpTotal: integer("xp_total").notNull().default(0),
  level: integer("level").notNull().default(1),
  tierBadge: text("tier_badge").notNull().default("tier-novice"),
  rankName: text("rank_name").notNull().default("Novice"),
  volumeTotal: numeric("volume_total").notNull().default("0"),
  weeklyXp: integer("weekly_xp").notNull().default(0),
  weekStart: text("week_start"),
  achievements: text("achievements").array().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({ id: true, updatedAt: true });
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;

export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, createdAt: true });
export type TradeRecord = typeof trades.$inferSelect;
export type InsertTradeRecord = z.infer<typeof insertTradeSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertCopyTradeSchema = createInsertSchema(copyTrades).omit({ id: true, createdAt: true });
export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CopyTrade = typeof copyTrades.$inferSelect;
export type InsertCopyTrade = z.infer<typeof insertCopyTradeSchema>;

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type ChatRequest = {
  message: string;
  walletAddress: string;
};

export type ParsedIntent = {
  action: string;
  tokens: {
    from?: string;
    to?: string;
    target?: string;
  };
  amount?: number;
  amountType?: 'exact' | 'percentage' | 'all';
  slippage?: number;
  confidence: number;
  rawInput: string;
  limitPrice?: number;
  limitSide?: 'buy' | 'sell';
  tokenName?: string;
  tokenSymbol?: string;
  description?: string;
  devBuyAmountSol?: number;
  triggerPrice?: number;
  slPrice?: number;
  tpPrice?: number;
};

export type ChatResponse = {
  reply: string;
  intent?: ParsedIntent;
  quote?: any;
  safetyData?: any;
  holdings?: any;
  priceData?: any;
  ordersData?: any;
  limitOrderData?: any;
  launchData?: any;
  sendData?: any;
  basketData?: any;
  tokenInfoData?: any;
  dcaData?: any;
  newTokensData?: any;
  payData?: any;
  alertData?: any;
  triggerOrderData?: any;
  lendData?: any;
  marketData?: any;
  copyTradeData?: any;
};
