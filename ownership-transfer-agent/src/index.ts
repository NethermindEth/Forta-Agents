import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { addHexPrefix, isZeroAddress} from "ethereumjs-util";
import { Log } from "forta-agent/dist/sdk/receipt";

export const OWNERSHIP_TRANSFERRED_EVENT_SIGNATURE: string =
  "OwnershipTransferred(address,address)";

const createFindingFromEvent = (event: Log) : Finding | null => {
  const prevOwnerHex: string = addHexPrefix(event.topics[1].slice(26));
  const newOwnerHex: string = addHexPrefix(event.topics[2].slice(26));

  // Ignore transfer from zero address
  if (isZeroAddress(prevOwnerHex)) {
    return null;
  }

  return Finding.fromObject({
    name: "Ownership Transferred",
    description: `The owner was transferred from ${prevOwnerHex} to ${newOwnerHex}`,
    alertId: "NEDMFORTA-2",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious
  });
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  return await (txEvent.filterEvent(
    OWNERSHIP_TRANSFERRED_EVENT_SIGNATURE
  ))
  .map(createFindingFromEvent)
  .filter(value => value !== null) as Finding[];
};

export default {
  handleTransaction,
};
