import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  tokens: [
    // UMEE/ETH
    {
      chainlinkFeedAddress: "0xa554F3a8D05f22aC7e105311211AAbAf727e1CcB",
      absoluteThreshold: "0.5",
      percentageThreshold: "25.55",
      intervalSeconds: "3600",
    },

    // ATOM/USD
    {
      chainlinkFeedAddress: "0xDC4BDB458C6361093069Ca2aD30D74cc152EdC75",
      absoluteThreshold: "10.5",
      percentageThreshold: "25.55",
      intervalSeconds: "3600",
    },
  ],
};

export default CONFIG;
