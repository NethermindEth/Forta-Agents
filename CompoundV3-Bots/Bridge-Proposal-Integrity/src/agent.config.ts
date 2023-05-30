import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Ethereum RPC URL
  mainnetRpcEndpoint: "https://eth.llamarpc.com",

  networkData: {
    [Network.POLYGON]: {
      // Address of the BridgeReceiver contract
      bridgeReceiver: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",

      // Block chunk size for log fetching (i.e. X blocks per getLogs call)
      blockChunk: 2_000,

      // Maximum number of blocks checked from the current network block to find a
      // matching proposal message
      pastBlocks: 10_000,
    },
  },
};

export default CONFIG;
