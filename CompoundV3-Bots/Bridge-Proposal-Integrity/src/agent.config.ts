import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.POLYGON]: {
    bridgeReceiver: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",
    fxRoot: "0xfe5e5d361b2ad62c541bab87c45a0b9b018389a2",
    timeLock: "0x6d903f6003cca6255d85cca4d3b5e5146dc33925",
    rpcEndpoint: "https://eth.llamarpc.com",
    blockChunk: 2 * 10 ** 3,
    pastBlocks: 10 * 10 ** 3,
  },
};

export default CONFIG;
