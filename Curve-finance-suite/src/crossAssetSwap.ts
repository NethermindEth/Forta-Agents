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
import abi from "./stable-swap-abi";

// @ts-ignore
import abiDecoder from "abi-decoder";

abiDecoder.addABI(abi);

export const web3 = new Web3();

export const CrossChainSwap = "TokenUpdate(uint256,address, address, uint256)";

const address = "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE";

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  if (!txEvent.addresses[address]) return findings;

  const filterFindings = txEvent.filterEvent(CrossChainSwap);
  if (!filterFindings.length) return findings;

  if (filterFindings) {
    findings.push(
      Finding.fromObject({
        name: "CrossChainSwap Me funciton called",
        description: "CrossChainSwap Me funciton called on pool",
        alertId: "NETHFORTA-24-4",
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
