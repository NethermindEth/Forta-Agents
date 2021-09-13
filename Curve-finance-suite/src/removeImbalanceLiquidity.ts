import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import Web3 from "web3";
import abi from "./abi";

// @ts-ignore
import abiDecoder from "abi-decoder";

abiDecoder.addABI(abi);

export const web3 = new Web3();

export const RemoveLiquidityImbalance =
  "RemoveLiquidiityImbalance(address, uint256[3], uint256[3],uint256, uint256)";

// export const RemoveLiquidityImbalance = {
//   name: "RemoveLiquidityImbalance",
//   inputs: [
//     { type: "address", name: "provider", indexed: true },
//     { type: "uint256[3]", name: "token_amounts", indexed: false },
//     { type: "uint256[3]", name: "fees", indexed: false },
//     { type: "uint256", name: "invariant", indexed: false },
//     { type: "uint256", name: "token_supply", indexed: false },
//   ],
//   anonymous: false,
//   type: "event",
// };
const address = "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE";

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  if (!txEvent.addresses[address]) return findings;

  const filterFindings = txEvent.filterEvent(RemoveLiquidityImbalance);
  if (!filterFindings.length) return findings;

  if (filterFindings) {
    findings.push(
      Finding.fromObject({
        name: "RemoveLiquidityImbalance Me funciton called",
        description: "RemoveLiquidityImbalance Me funciton called on pool",
        alertId: "NETHFORTA-24-3",
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
        metadata: {
          data: JSON.stringify(filterFindings),
        },
      })
    );
  }

  return findings;
};

export default {
  handleTransaction,
  // handleBlock
};
