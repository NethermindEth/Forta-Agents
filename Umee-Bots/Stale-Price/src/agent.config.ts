import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // threshold after 24 hour
  threshold: 86400,
  // Address of the UmeeOracle contract
  umeeOracleAddress: "0x67386481E5A3076563F39831Bb79d05D393d57bf",
  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

// Uncomment these lines for the testnet test:
// CONFIG.umeeOracleAddress = "0x96A2F421D0E1626C0728CaEd5F05cD629D9867dA";
// CONFIG.lendingPoolAddress = "0xce744a9baf573167b2cf138114ba32ed7de274fa";

export default CONFIG;
