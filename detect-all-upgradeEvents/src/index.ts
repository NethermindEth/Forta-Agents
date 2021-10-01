import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from "forta-agent";
import keccak256 from "keccak256";

// any upgrade topic event can be passed through
export const UPGRADE_EVENT_SIGNATURE = "Upgraded(address)";
// if running agent for specific agent is demanded, pass the contract address
export const CONTRACT_ADDRESS = "0xfffff";

export const generateHash = (signature: string): string => {
  const hash = keccak256(signature).toString("hex");
  return "0x" + hash;
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const upgradeEvents = txEvent.filterEvent(
    UPGRADE_EVENT_SIGNATURE,
    CONTRACT_ADDRESS.length > 0 ? CONTRACT_ADDRESS : undefined
  );

  if (!upgradeEvents.length) return findings;

  findings.push(
    Finding.fromObject({
      name: "Upgrade Event Detection",
      description: `Upgrade event is detected.`,
      alertId: "NETHFORTA-5",
      type: FindingType.Suspicious,
      severity: FindingSeverity.High,
      metadata: {
        proxy: CONTRACT_ADDRESS
      }
    })
  );

  return findings;
};

export default {
  handleTransaction
};
