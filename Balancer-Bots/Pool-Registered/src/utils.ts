export interface AgentConfig {
  vaultAddress: string;
}

export enum PoolSpecialization {
  GENERAL = 0,
  MINIMAL_SWAP_INFO = 1,
  TWO_TOKEN = 2,
}
