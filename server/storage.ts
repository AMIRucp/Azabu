import { db } from "./db";
import {
  users, transactions, copyTrades, trades,
  type User, type InsertUser,
  type Transaction, type InsertTransaction,
  type CopyTrade, type InsertCopyTrade,
  type TradeRecord, type InsertTradeRecord,
} from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

export interface IStorage {
  getUser(walletAddress: string): Promise<User | undefined>;
  createOrUpdateUser(user: InsertUser): Promise<User>;
  
  getTransactions(walletAddress: string): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, signature?: string): Promise<Transaction>;

  getCopyTrades(walletAddress: string): Promise<CopyTrade[]>;
  createCopyTrade(ct: InsertCopyTrade): Promise<CopyTrade>;
  deactivateCopyTrade(walletAddress: string, targetWallet: string): Promise<CopyTrade | null>;
  deactivateAllCopyTrades(walletAddress: string): Promise<number>;
  updateCopyTradeLastSig(id: number, sig: string): Promise<void>;
  getActiveCopyTrades(): Promise<CopyTrade[]>;

  recordTrade(trade: InsertTradeRecord): Promise<TradeRecord>;
  getRecentTrades(limit?: number): Promise<TradeRecord[]>;
  getLeaderboard(since: Date): Promise<{ wallet: string; pnl: number; volume: number; tradeCount: number; winRate: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createOrUpdateUser(insertUser: InsertUser): Promise<User> {
    const existing = await this.getUser(insertUser.walletAddress);
    if (existing) {
      if (insertUser.slippageTolerance !== undefined) {
        const [updated] = await db.update(users)
          .set({ slippageTolerance: insertUser.slippageTolerance })
          .where(eq(users.walletAddress, insertUser.walletAddress))
          .returning();
        return updated;
      }
      return existing;
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTransactions(walletAddress: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.walletAddress, walletAddress));
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(tx).returning();
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string, signature?: string): Promise<Transaction> {
    const [updated] = await db.update(transactions)
      .set({ status, signature })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getCopyTrades(walletAddress: string): Promise<CopyTrade[]> {
    return await db.select().from(copyTrades).where(eq(copyTrades.walletAddress, walletAddress));
  }

  async createCopyTrade(ct: InsertCopyTrade): Promise<CopyTrade> {
    const existing = await db.select().from(copyTrades).where(
      and(eq(copyTrades.walletAddress, ct.walletAddress), eq(copyTrades.targetWallet, ct.targetWallet), eq(copyTrades.active, true))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(copyTrades)
        .set({ scale: ct.scale, active: true })
        .where(eq(copyTrades.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(copyTrades).values(ct).returning();
    return created;
  }

  async deactivateCopyTrade(walletAddress: string, targetWallet: string): Promise<CopyTrade | null> {
    const rows = await db.update(copyTrades)
      .set({ active: false })
      .where(and(eq(copyTrades.walletAddress, walletAddress), eq(copyTrades.targetWallet, targetWallet), eq(copyTrades.active, true)))
      .returning();
    return rows[0] || null;
  }

  async deactivateAllCopyTrades(walletAddress: string): Promise<number> {
    const rows = await db.update(copyTrades)
      .set({ active: false })
      .where(and(eq(copyTrades.walletAddress, walletAddress), eq(copyTrades.active, true)))
      .returning();
    return rows.length;
  }

  async updateCopyTradeLastSig(id: number, sig: string): Promise<void> {
    await db.update(copyTrades).set({ lastCheckedSig: sig }).where(eq(copyTrades.id, id));
  }

  async getActiveCopyTrades(): Promise<CopyTrade[]> {
    return await db.select().from(copyTrades).where(eq(copyTrades.active, true));
  }

  async recordTrade(trade: InsertTradeRecord): Promise<TradeRecord> {
    const [record] = await db.insert(trades).values(trade).returning();
    return record;
  }

  async getRecentTrades(limit = 50): Promise<TradeRecord[]> {
    return await db.select().from(trades).orderBy(desc(trades.createdAt)).limit(limit);
  }

  async getLeaderboard(since: Date): Promise<{ wallet: string; pnl: number; volume: number; tradeCount: number; winRate: number }[]> {
    const rows = await db
      .select({
        wallet: trades.wallet,
        volume: sql<number>`COALESCE(SUM(CAST(${trades.sizeUsd} AS DOUBLE PRECISION)), 0)`,
        tradeCount: sql<number>`COUNT(*)::int`,
      })
      .from(trades)
      .where(gte(trades.createdAt, since))
      .groupBy(trades.wallet)
      .orderBy(sql`SUM(CAST(${trades.sizeUsd} AS DOUBLE PRECISION)) DESC`)
      .limit(50);

    return rows.map(r => ({
      wallet: r.wallet,
      pnl: 0,
      volume: Number(r.volume),
      tradeCount: Number(r.tradeCount),
      winRate: 0,
    }));
  }
}

export const storage = new DatabaseStorage();
