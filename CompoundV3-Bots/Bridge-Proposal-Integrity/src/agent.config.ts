import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.POLYGON]: {
    bridgeReceiver: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",
    rpcEndpoint: "https://eth.llamarpc.com",
    blockChunk: 2 * 10 ** 3,
    pastBlocks: 10 * 10 ** 3,
  },
};

export default CONFIG;
