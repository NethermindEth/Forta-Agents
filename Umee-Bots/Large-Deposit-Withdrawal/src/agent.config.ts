import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // threshold in USD
  threshold: "2000000",

  // Chainlink feed for the ETH-USD pair
  ethUsdFeedAddress: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",

  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",

  // Address of the Umee Oracle contract
  umeeOracleAddress: "0x67386481E5A3076563F39831Bb79d05D393d57bf",
};

// Uncomment this line for the mainnet test:

// CONFIG.threshold = "1000000";

// Uncomment these lines for the testnet test:

// CONFIG.lendingPoolAddress = "0x61d85C1aCF5CcB23739B751BEfebB08A4738BB9d";
// CONFIG.ethUsdFeedAddress = "0xE07E534e00822b8f070a0d648a2BF5D401b665Ea";
// CONFIG.umeeOracleAddress = "0xAc42062E914114dBe75A79468a22FB873D36860b";

export default CONFIG;
