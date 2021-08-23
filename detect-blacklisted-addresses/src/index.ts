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

const BLACKLISTED_ADDRESSES: string[] = [];

export const createFinding = (addressesDetected: string[]): Finding => {
  return Finding.fromObject({
    name: "Chainkeeper",
    description: "Detect transactions involving blacklisted addresses",
    alertId: "NETHFORTA-18",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      Addresses: JSON.stringify(addressesDetected),
    },
  });
};

export const provideHandleTransaction = (
  blacklistedAddresses: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const blacklistedAddressesInvolved = blacklistedAddresses.filter(
      (addr: string) => txEvent.addresses[addr]
    );

    if (blacklistedAddressesInvolved.length === 0) {
      return findings;
    }

    findings.push(createFinding(blacklistedAddressesInvolved));
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(BLACKLISTED_ADDRESSES),
};
