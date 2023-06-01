import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.POLYGON]: {
    // Address of the bridge receiver contract
    bridgeReceiverAddress: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",
    // Maximum block range to find the corresponding proposal creation event
    // from the block a proposal is executed
    creationFetchingBlockRange: 100_000,
    // Maximum amount of blocks per eth_getLogs call to find proposal creation
    // events. Typical provider limits should be noticed when setting this
    // field.
    creationFetchingBlockStep: 5_000,
  },
};

export default CONFIG;
