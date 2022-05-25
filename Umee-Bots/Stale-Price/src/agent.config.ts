import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Address of the UmeeOracle contract
  umeeOracleAddress: "0x67386481E5A3076563F39831Bb79d05D393d57bf",
  // Address of the LendingPool contract
  lendingPoolAddress: "0xce744a9baf573167b2cf138114ba32ed7de274fa",
};

// Uncomment these lines for the testnet test:
// CONFIG.umeeOracleAddress = "";
// CONFIG.lendingPoolAddress = "";

export default CONFIG;
