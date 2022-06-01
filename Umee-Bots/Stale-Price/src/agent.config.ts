import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Interval after which oracle data will be considered stale (in seconds)
  threshold: 86400,
  // Address of the UmeeOracle contract
  umeeOracleAddress: "0x67386481E5A3076563F39831Bb79d05D393d57bf",
  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

// Uncomment these lines for the testnet test:
CONFIG.umeeOracleAddress = "0xC637f5905C2A2d780cD7B9d8982f4c5b5b128200";
CONFIG.lendingPoolAddress = "0xC637f5905C2A2d780cD7B9d8982f4c5b5b128200";

export default CONFIG;
