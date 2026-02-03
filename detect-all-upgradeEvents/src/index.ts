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
// If you want to monitor a single proxy, set this to its address.
// Leaving it empty means "detect upgrades for all contracts".
export const CONTRACT_ADDRESS = "";

// Topic0 for `Upgraded(address)`.
// Note: the `indexed` keyword is not part of the event signature hash.
export const UPGRADE_EVENT_TOPIC = (() => {
  const hash = keccak256(UPGRADE_EVENT_SIGNATURE).toString("hex");
  return "0x" + hash;
})();

const normalizeAddress = (addr?: string): string => (addr || "").toLowerCase();

// `Upgraded(address indexed implementation)` stores the new implementation in topics[1].
const topicToAddress = (topic?: string): string => {
  if (!topic || topic.length < 66) return "";
  // topic is 32 bytes hex, take last 20 bytes
  return ("0x" + topic.slice(topic.length - 40)).toLowerCase();
};

export const generateHash = (signature: string): string => {
  const hash = keccak256(signature).toString("hex");
  return "0x" + hash;
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // We do explicit log parsing here instead of txEvent.filterEvent()
  // because this agent targets the topic-level signal and we want
  // richer metadata (proxy, new implementation, caller, tx hash) and
  // deterministic deduping within the same transaction.
  const txHash = (txEvent as any)?.transaction?.hash || (txEvent as any)?.hash || "";
  const caller = (txEvent as any)?.transaction?.from || (txEvent as any)?.from || "";

  const targetAddr = normalizeAddress(CONTRACT_ADDRESS);
  const seen = new Set<string>();

  for (const log of txEvent.logs || []) {
    const logAddr = normalizeAddress((log as any)?.address);
    const topics: string[] = (log as any)?.topics || [];
    if (!logAddr || topics.length === 0) continue;

    // Optional contract filter
    if (targetAddr && logAddr !== targetAddr) continue;

    if (topics[0]?.toLowerCase() !== UPGRADE_EVENT_TOPIC.toLowerCase()) continue;

    const newImpl = topicToAddress(topics[1]);
    // Dedupe key: (txHash, proxy, newImplementation)
    const key = `${String(txHash).toLowerCase()}:${logAddr}:${newImpl || "na"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    findings.push(
      Finding.fromObject({
        name: "Upgrade Event Detection",
        description: `Upgrade event detected for proxy ${logAddr}`,
        alertId: "NETHFORTA-5",
        type: FindingType.Suspicious,
        severity: FindingSeverity.High,
        metadata: {
          proxy: logAddr,
          newImplementation: newImpl,
          caller: normalizeAddress(caller),
          txHash: String(txHash).toLowerCase()
        }
      })
    );
  }

  return findings;
};

export default {
  handleTransaction
};
