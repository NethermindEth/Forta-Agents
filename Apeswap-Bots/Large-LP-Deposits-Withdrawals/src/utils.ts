import { BigNumber, utils } from "ethers";
import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { getCreate2Address } from "@ethersproject/address";

const POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from("100000000000000000000000");
const AMOUNT_THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(10);

// [APESWAP_FACTORY, INIT_CODE] from the initializer function
export const initialized: string[] = [];

const apePairCreate2 = (token0: string, token1: string): string => {
  let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(initialized[0], salt, initialized[1]).toLowerCase();
};

const EVENTS_ABI: string[] = [
  "event Mint(address indexed sender, uint amount0, uint amount1)",
  "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)",
];
const EVENTS_IFACE: Interface = new Interface(EVENTS_ABI);

const FUNCTIONS_ABI: string[] = [
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address) public view returns (uint256)",
];
const FUNCTIONS_IFACE: Interface = new Interface(FUNCTIONS_ABI);

const createFinding = (log: LogDescription, token0: string, token1: string): Finding => {
  const metadata = {
    pool: log.address,
    token0: token0,
    amount0: log.args.amount0.toString(),
    token1: token1,
    amount1: log.args.amount1.toString(),
  };
  switch (log.name) {
    case "Mint":
      return Finding.fromObject({
        name: "Large LP Deposit in Apeswap pool",
        description: `${log.name} event with large amounts emitted from Apeswap pool`,
        alertId: "APESWAP-9-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata,
      });
    default:
      return Finding.fromObject({
        name: "Large LP Withdrawal from Apeswap pool",
        description: `${log.name} event with large amount emitted from an Apeswap pool`,
        alertId: "APESWAP-9-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata,
      });
  }
};

export default {
  POOL_SUPPLY_THRESHOLD,
  AMOUNT_THRESHOLD_PERCENTAGE,
  initialized,
  apePairCreate2,
  FUNCTIONS_ABI,
  FUNCTIONS_IFACE,
  EVENTS_ABI,
  EVENTS_IFACE,
  createFinding,
};
