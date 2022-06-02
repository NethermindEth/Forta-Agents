import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // uTokens and uToken addresses that will be watched.
  uTokens: [
    { uToken: "uDAI", address: "0x762E5982EB0D944A9800D7caBAF640464E892C91" },
    { uToken: "uUSDC", address: "0x0EDf29d931b68D673bdCDD35B20e26eEC0532F25" },
    { uToken: "uUSDT", address: "0x2394eAc76A0B7992FB8aa0F0C126317Af76Ae707" },
    { uToken: "uWETH", address: "0x50D695cf7a86cFe415642cBCb25B025a9B1597e7" },
    { uToken: "uATOM", address: "0x0A6172fb19E85DBae18898eA2f7a596B5681f1eE" },
  ],

  /*
    uToken pairs that will be watched. ratio is uToken1/uToken2
    threshold is the minimum difference that will trigger the alert
    difference is the severity of the drop. severity will increase with each difference level
    `Info`: 0.10-0.15
    `Low`: 0.15-0.20
    `Medium`: 0.20-0.25
    `High`: 0.25-0.30
    `Critical`: 0.30+
  */
  uTokenPairs: [
    { uToken1: "uUSDC", uToken2: "uDAI", threshold: 0.1, difference: 0.05 }, // ratio of uDAI / uUSDC
    { uToken1: "uUSDC", uToken2: "uUSDT", threshold: 0.1, difference: 0.05 }, // ratio of uUSDC / uUSDT
    { uToken1: "uDAI", uToken2: "uUSDT", threshold: 0.1, difference: 0.05 }, // ratio of uDAI / uUSDT
    { uToken1: "uWETH", uToken2: "uATOM", threshold: 0.1, difference: 0.05 }, // ratio of uWETH / uATOM
  ],

  umeeOracle: "0x67386481E5A3076563F39831Bb79d05D393d57bf",

  lendingPool: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

// Uncomment these lines for the testnet test:

// CONFIG.umeeOracle = "0xAc42062E914114dBe75A79468a22FB873D36860b";
// CONFIG.lendingPool = "0xcd5A836EeDA05FE2d05B3ec65E15CAB594978B28";
// CONFIG.uTokens[0].address = "0xe1bb939ac7fb9ccb52e9d402972ec12261404211";
// CONFIG.uTokens[1].address = "0x2a359Cbd17e2F5F67F0E68d6A21112cF66015842";
// CONFIG.uTokens[2].address = "0x99779742921ADa303946F0e3EB3F563F8F822c80";
// CONFIG.uTokens[3].address = "0xBe716bd6726746833CB572f7baB0e719caba0dC6";
// CONFIG.uTokens[4].address = "0x3fc18c6fE91Dd46f29c641f54763f195a21fcfA3";
// CONFIG.uTokenPairs[1].threshold = 0.1;
// CONFIG.uTokenPairs[2].threshold = 0.1;
// CONFIG.uTokenPairs[3].threshold = 0.1;
// CONFIG.uTokenPairs[0].threshold = 0.1;

export default CONFIG;
