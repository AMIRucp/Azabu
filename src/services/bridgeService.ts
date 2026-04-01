export interface BridgeStepUpdate {
  step: "quote" | "signing" | "confirming" | "tracking" | "done";
  message: string;
  progress: number;
}

export interface BridgeResult {
  success: boolean;
  error?: string;
  txHash?: string;
  explorerUrl?: string;
}
