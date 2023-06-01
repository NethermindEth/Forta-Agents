import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

export const DEBUG: boolean = false;
export const DEBUG_LAST_BLOCK: number = 16769029;

const CONFIG: AgentConfig = {
  // Ethereum RPC URL
  mainnetRpcEndpoint: "https://eth.llamarpc.com",

  networkData: {
    [Network.POLYGON]: {
      // Address of the BridgeReceiver contract
      bridgeReceiverAddress: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",

      // Maximum number of Ethereum blocks checked from the current block to
      // find a matching proposal message
      messagePassFetchingBlockRange: 10_000,

      // Block chunk size for log fetching (i.e. X blocks per getLogs call).
      // Typical provider limits should be noticed when setting this field.
      messagePassFetchingBlockStep: 2_000,
    },
  },
};

export default CONFIG;
