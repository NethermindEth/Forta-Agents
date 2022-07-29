import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

export const CONFIG: AgentConfig = {
  [Network.ARBITRUM]: {
    // GMX Vault address
    address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
    // Token addresses
    tokens: {
      WETH: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      WBTC: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
      LINK: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
      UNI: "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
      USDC: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
      FRAX: "0x17fc002b466eec40dae837fc4be5c67993ddbd6f",
      MIM: "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a",
    },
    // Chainlink USD data feed
    priceFeed: {
      WETH: "0x639fe6ab55c921f74e7fac1ee960c0b6293ba612",
      WBTC: "0x6ce185860a4963106506c203335a2910413708e9",
      LINK: "0x86e53cf1b870786351da77a57575e79cb55812cb",
      UNI: "0x9c917083fdb403ab5adbec26ee294f6ecada2720",
      USDC: "0x50834f3163758fcc1df9973b6e91f0f0f0434ad3",
      USDT: "0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7",
      DAI: "0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb",
      FRAX: "0x0809e3d38d1b4214958faf06d8b1b1a2b73f2ab8",
      MIM: "0x87121f6c9a9f6e90e59591e4cf4804873f54a95b",
    },
  },
  [Network.AVALANCHE]: {
    // GMX Vault address
    address: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
    // Token addresses
    tokens: {
      WETH: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
      WBTC: "0x408d4cd0adb7cebd1f1a1c33a0ba2098e1295bab",
      LINK: "0x5947bb275c521040051d82396192181b413227a3",
      UNI: "0x8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580",
      USDC: "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
      USDT: "0xc7198437980c041c805a1edcba50c1ce5db95118",
      DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
      FRAX: "0xdc42728b0ea910349ed3c6e1c9dc06b5fb591f98",
      MIM: "0x130966628846bfd36ff31a822705796e8cb8c18d",
    },
    // Chainlink USD data feed
    priceFeed: {
      WETH: "0x976b3d034e162d8bd72d6b9c989d545b839003b0",
      WBTC: "0x2779d32d5166baaa2b2b658333ba7e6ec0c65743",
      LINK: "0x49ccd9ca821efeab2b98c60dc60f518e765ede9a",
      UNI: "0x9a1372f9b1b71b3a5a72e092ae67e172dbd7daaa",
      USDC: "0xf096872672f44d6eba71458d74fe67f9a77a23b9",
      USDT: "0xebe676ee90fe1112671f19b6b7459bc678b67e8a",
      DAI: "0x51d7180eda2260cc4f6e4eebb82fef5c3c2b8300",
      FRAX: "0xbba56ef1565354217a3353a466edb82e8f25b08e",
      MIM: "0x54edab30a7134a16a54218ae64c73e1daf48a8fb",
    },
  },
};

//Represents the ratio at which an account becomes suspicious of having too many profitable trades
export const PROFIT_RATIO = 0.9; //0 to 1, 0.5

//Represents the number of trades an account can make before the bot will monitor its ratio
export const GRACE_TRADES = 5; //1+
