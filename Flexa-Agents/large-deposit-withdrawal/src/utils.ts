import {
  LogDescription,
  Finding,
  FindingSeverity,
  FindingType,
} from "forta-agent";

export const STAKING_CONTRACT = "0x706D7F8B3445D8Dfc790C524E3990ef014e7C578"; //Flexa staking contract
export const EVENTS_SIGNATURES = [
  "event SupplyReceipt(address indexed supplier, bytes32 indexed partition, uint256 amount, uint256 indexed nonce)",
  "event Withdrawal(address indexed supplier, bytes32 indexed partition, uint256 amount, uint256 indexed rootNonce, uint256 authorizedAccountNonce)",
  "event FallbackWithdrawal(address indexed supplier, bytes32 indexed partition, uint256 indexed amount)",
];

export const CHAINLINK_AMP_DATA_FEED =
  "0x8797ABc4641dE76342b8acE9C63e3301DC35e3d8";

export const PRICE_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
];

export const createFinding = (log: LogDescription) => {
  const name = log.name == "SupplyReceipt" ? "Deposit" : "Withdrawal";
  return Finding.fromObject({
    name: `Large ${name} detected on Flexa staking contract`,
    description: `${log.name} event emitted with a large amount`,
    alertId: "FLEXA-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa",
    metadata: {
      supplier: log.args.supplier.toLowerCase(),
      amount: log.args.amount.toHexString(),
    },
  });
};
