// @dev the following information is tentative

// minimum percentage (%) change in token balance for a monitored address to trigger an alert
export const MAINET_PERCENTAGE_CHANGE_THRESHOLD = 1;
export const OPTIMISM_PERCENTAGE_CHANGE_THRESHOLD = 10;
export const POLYGON_PERCENTAGE_CHANGE_THRESHOLD = 10;
export const ARBITRUM_PERCENTAGE_CHANGE_THRESHOLD = 10;

// List of token contract addresses that are monitored for transfers
export const MAINNET_MONITORED_TOKENS = [
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" // WBTC
];
export const OPTIMISM_MONITORED_TOKENS = [
  "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC
  "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
  "0x4200000000000000000000000000000000000006", // WETH
  "0x4200000000000000000000000000000000000042", // OP
  "0x68f180fcCe6836688e9084f035309E29Bf0A2095"  // WBTC
];
export const POLYGON_MONITORED_TOKENS = [
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
  "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
  "0x0000000000000000000000000000000000001010", // MATIC
  "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
  "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"  // WBTC
];
export const ARBITRUM_MONITORED_TOKENS = [
  "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
  "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
  "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
  "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"  // BTC
];

// List of wallet addresses that are monitored for transfers
export const MAINNET_MONITORED_ADDRESSES = [
  "0x205de52B86343CecF979ED5589D5A21d6e1D9b8F",
  "0x45B522B0C2F7fEd988F10E0eb14BD935d8872B59",
];
export const OPTIMISM_MONITORED_ADDRESSES = [];
export const POLYGON_MONITORED_ADDRESSES = [];
export const ARBITRUM_MONITORED_ADDRESSES = [];
