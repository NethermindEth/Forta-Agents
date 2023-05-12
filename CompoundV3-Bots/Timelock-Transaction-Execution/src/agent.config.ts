import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.POLYGON]: {
    bridgeReceiverAddress: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",
  },
};

export default CONFIG;
