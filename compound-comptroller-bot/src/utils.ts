export const PAUSE_EVENTS_ABIS = [
  "event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian)",
  "event ActionPaused(string action, bool pauseState)",
  "event ActionPaused(address cToken, string action, bool pauseState)",
];

export interface NetworkData {
  compoundComptrollerAddress: string;
}

export type AgentConfig = Record<number, NetworkData>;
