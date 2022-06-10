export interface AgentConfig {
  threshold: number;
  monitoredAddresses: string[];
}

export const CONFIG: AgentConfig = {
  // Minimum number of accounts involved in a transaction in order for a finding to be emitted
  threshold: 20,

  // Addresses that need to be part of the transaction's involved addresses in order for a finding to be emitted
  monitoredAddresses: [
    "0xc0a4Df35568F116C370E6a6A6022Ceb908eedDaC", // Umee
    "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa", // Lending Pool
    "0x67386481E5A3076563F39831Bb79d05D393d57bf", // Umee Oracle
    "0x45cb9655f26992eac712ae5409b4079781968479", // A random account
  ],
};

// Uncomment these lines for the mainnet test:

// CONFIG.monitoredAddresses = [
//   "0xc0a4Df35568F116C370E6a6A6022Ceb908eedDaC",
//   "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
//   "0x67386481E5A3076563F39831Bb79d05D393d57bf",
//   "0x45cb9655f26992eac712ae5409b4079781968479",
// ];
// CONFIG.threshold = 20;

// Uncomment these lines for the testnet test:

// CONFIG.monitoredAddresses = [
//   "0x3526a2fe5dA32d0f0814086848628bF12A1E4417",
//   "0x96A2F421D0E1626C0728CaEd5F05cD629D9867dA",
//   "0x00Cd6757A77014Ab83C9fCD46ea53Ce880bc31CB",
// ];
// CONFIG.threshold = 10;
