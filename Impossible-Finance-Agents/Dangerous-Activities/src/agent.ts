import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import utils, { Verifier } from "./utils";
import impossibleAddresses from "./impossible.addresses";
import DarklistVerifier from "./darklist.verifier";

const UPDATE_THRESHOLD: number = 86400; // one day
const DARKLIST_VERIFIER = new DarklistVerifier(UPDATE_THRESHOLD);
const IMPOSSIBLE_VERIFIER: Verifier = utils.listVerifier(impossibleAddresses);
const DANGEROUS_VERIFIER: Verifier = DARKLIST_VERIFIER.isDark.bind(DARKLIST_VERIFIER);

const createFinding = (impossible: string[], dangerous: string[]) =>
  Finding.fromObject({
    name: "Impossible Finance interaction monitor",
    description: "A known dangerous address has interacted with an Impossible Finance smart contract",
    alertId: "IMPOSSIBLE-8",
    protocol: "Impossible Finance",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      impossibleAddresses: impossible.toString(),
      dangerousAddresses: dangerous.toString(),
    },
  });

export const provideHandleTransaction =
  (impossibleVerifier: Verifier, dangerousVerifier: Verifier): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const timestamp: number = txEvent.timestamp;
    const blockNumber: number = txEvent.blockNumber;

    const impossibleInteraction: string[] = [];
    const dangerousInteraction: string[] = [];

    await Promise.all(
      Object.keys(txEvent.addresses).map(async (involvedAddress: string) => {
        const [isImpossible, isDangerous] = await Promise.all([
          impossibleVerifier(involvedAddress, timestamp, blockNumber),
          dangerousVerifier(involvedAddress, timestamp, blockNumber),
        ]);
        if (isImpossible) impossibleInteraction.push(involvedAddress);
        if (isDangerous) dangerousInteraction.push(involvedAddress);
      })
    );

    if (impossibleInteraction.length && dangerousInteraction.length)
      findings.push(createFinding(impossibleInteraction, dangerousInteraction));

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(IMPOSSIBLE_VERIFIER, DANGEROUS_VERIFIER),
};
