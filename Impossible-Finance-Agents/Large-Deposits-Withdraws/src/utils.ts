import { Interface } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const PERCENT = 10;
//events signatures
export const STAKE_ABI = "event Stake(uint24 indexed trackId, address indexed user, uint104 amount)";
export const UNSTAKE_ABI = "event Unstake(uint24 indexed trackId, address indexed user, uint104 amount)";
export const PURCHASE_ABI = "event Purchase(address indexed sender, uint256 indexed paymentAmount)";
export const WITHDRAW_ABI = "event Withdraw(address indexed sender, uint256 indexed amount)";

//contracts addresses
export const STAKING_CONTRACT = "0x1d37f1e6f0cce814f367d2765ebad5448e59b91b"; // IF Allocation Master V1.5
export const IDIA_TOKEN = "0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89";
export const SALE_CONTRACTS = [
  "0x53E36E2565e8113dF6c1C675B3bC7eC1788cD1C9", // IDIA Main Sale Contract
  "0x843626d70f7F4B9e9a8a56596d34470e347aeb87", // IDIA Gleam $100 Sale
  "0x17AA5354E25922A23B952a28fbdA63a0C7d9B09B", // IDIA Gleam $10 Sale
  "0x69B9737AFf26bC528Ffee4cC3257407be6a13252", // OSWAP Standard Sale Contract
  "0x0246F87125973ACAb0293BB851dac34f7644344A", // OSWAP Unlimited Sale Contract
  "0xD7d47a9B298b7e3C5919D376aAd20Fa4970fb73B", // OSWAP Gleam $100 Sale Contract
  "0x7fc32F60a92b6C109f3c74Fea3eaaAb9Ad062292", // OSWAP Gleam $50 Sale Contract
  "0xb278163B1D2Da632D51190001BBb95d45C3b191a", // BLT Standard Sale Contract
  "0x9Df80e3DD83C011d1258c6fCD2d723F487751aD7", // BLT Unlimited Sale Contract
  "0x09d70dB37cEDe94D1664C0B2fBD4d1b7ec9a88E0", // HIGH Standard Sale Contract
  "0xB0b2fD6fe766EaE258e26AdD5E74987E21FA36B2", // HIGH Unlimited Sale Contract
  "0xb20278fe899a4aE271a81CA4D70E8D2FA57b24cF", // HIGH Gleam Whitelist and Misc ($100) Sale
  "0x35De9fDa52B41E77b442416eeAE5FFC16Cd9e2FF", // HIGH KOL #1 ($100) Sale
  "0xD19EadFF1f68B4b968D26C3B541A9F305B483b01", // HIGH KOL #2 ($200) Sale
  "0x55ce59c6d8ebe7ad7dFFD50821CaB4DB0Fc9D8B5", // HIGH KOL #3 ($500) Sale
  "0x130b6d9ff4470828F220c4056e3EA4a8d20784Eb", // ARDN Standard Sale Contract
  "0x9792ec69629f7db468b05102482a68D547B1F502", // ARDN Unlimited Sale Contract
  "0xe3444Bc6ef903310dbfF670897Af9FDc06E8CbA4", // ARDN Gleam $100 Sale Contract
];

export const SUPPLY_ABI = ["function totalSupply() external view returns (uint256)"];
export const SALE_ABI = ["function totalPaymentReceived() view returns (uint256)"];
export const SALE_IFACE: Interface = new Interface(SALE_ABI);
export const SUPPLY_IFACE: Interface = new Interface(SUPPLY_ABI);

export const createStakeFinding = (log: LogDescription, alertId: string) =>
  Finding.fromObject({
    name: `Large ${log.name} detected on staking contract.`,
    description: `${log.name}() event emitted with a large amount`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      from: log.args[1].toLowerCase(),
      amount: log.args[2].toString(),
    },
  });

export const createSaleFinding = (log: LogDescription, alertId: string) =>
  Finding.fromObject({
    name: `Large ${log.name} detected.`,
    description: `${log.name}() event emitted with a large amount`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      saleContract: log.address.toLowerCase(),
      from: log.args[0],
      amount: log.args[1].toString(),
    },
  });
