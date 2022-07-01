import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  tokens: [
    // UMEE/ETH
    {
      // address of the desired chainlink feed
      chainlinkFeedAddress: "0xa554F3a8D05f22aC7e105311211AAbAf727e1CcB",
      // absolute threshold above which a finding will be emitted (represented as decimal)
      absoluteThreshold: "0.5",
      // percentage relative threshold above which a finding will be emitted
      percentageThreshold: "25.55",
      // interval between price checks, in seconds
      intervalSeconds: "3600",
    },

    // ATOM/USD
    {
      // address of the desired chainlink feed
      chainlinkFeedAddress: "0xDC4BDB458C6361093069Ca2aD30D74cc152EdC75",
      // absolute threshold above which a finding will be emitted (represented as decimal)
      absoluteThreshold: "10.5",
      // percentage relative threshold above which a finding will be emitted
      percentageThreshold: "25.55",
      // interval between price checks, in seconds
      intervalSeconds: "3600",
    },
  ],
};

// Uncomment these lines for the Ethereum mainnet test:

// CONFIG.tokens = [
//   {
//     chainlinkFeedAddress: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
//     absoluteThreshold: "0",
//     intervalSeconds: "0",
//   },
// ];

export default CONFIG;
