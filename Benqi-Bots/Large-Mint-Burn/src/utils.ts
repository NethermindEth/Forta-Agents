import { Interface, LogDescription } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

// Address of the PGL contract.
export const PGL_CONTRACT = "0xE530dC2095Ef5653205CF5ea79F8979a7028065c";
// Address of PoC contract on Ropsten testnet.
export const TESTNET_PGL_CONTRACT = "0xBF544D286749845b26BA6aA708939E8DF59557d7";
// Mint, Burn events signatures.
export const EVENTS_SIGNATURES = [
  "event Mint(address indexed sender, uint amount0, uint amount1)",
  "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)",
];
// getReserves function signature
export const RESERVES_FUNCTION = new Interface([
  "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)",
]);

// Percentage used to set the thresholds
export const PERCENT = 10;

// Function to generate the agent's findings
export const createFinding = (log: LogDescription) => {
  let finding;
  log.name == "Mint"
    ? (finding = Finding.fromObject({
        name: `Large ${log.name} on PGL contract`,
        description: `${log.name} event was emitted in PGL Contract with large tokens amount`,
        alertId: "BENQI-8-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          sender: log.args.sender.toLowerCase(),
          amount0: log.args.amount0.toString(),
          amount1: log.args.amount1.toString(),
        },
      }))
    : (finding = Finding.fromObject({
        name: `Large ${log.name} on PGL contract`,
        description: `${log.name} event was emitted in PGL Contract with large tokens amount`,
        alertId: "BENQI-8-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          sender: log.args.sender.toLowerCase(),
          amount0: log.args.amount0.toString(),
          amount1: log.args.amount1.toString(),
          to: log.args.to.toLowerCase(),
        },
      }));
  return finding;
};
