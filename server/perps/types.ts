import type { IdlAccounts, ProgramAccount, IdlTypes } from "@coral-xyz/anchor";
import { type Perpetuals } from "./jupiterPerpetualsIdl";

export type Position = IdlAccounts<Perpetuals>["position"];
export type PositionAccount = ProgramAccount<Position>;

export type PositionRequest = IdlAccounts<Perpetuals>["positionRequest"];
export type PositionRequestAccount = ProgramAccount<PositionRequest>;

export type Custody = IdlAccounts<Perpetuals>["custody"];
export type CustodyAccount = ProgramAccount<Custody>;

export type Pool = IdlAccounts<Perpetuals>["pool"];

export type ContractTypes = IdlTypes<Perpetuals>;
export type OraclePrice = IdlTypes<Perpetuals>["OraclePrice"];
export type PoolApr = ContractTypes["PoolApr"];

export interface OnChainPerpsResult {
  transaction: string;
  method: "onchain" | "rest_api";
}

export interface PoolData {
  name: string;
  custodies: string[];
  aumUsd: number;
  totalVolume: number;
}
