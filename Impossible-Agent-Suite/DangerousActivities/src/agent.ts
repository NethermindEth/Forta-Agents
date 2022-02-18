import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
} from 'forta-agent';
import utils, { Verifier } from './utils';
import bscDangerous from './bsc.dangerous';
import impossibleAddresses from './impossible.addresses';


const DANGEROUS_VERIFIER: Verifier = utils.listVerifier(bscDangerous);
const IMPOSSIBLE_VERIFIER: Verifier = utils.listVerifier(impossibleAddresses);


const createFinding = (impossible: string[], dangerous: string[]) => Finding.fromObject({
  name: "Impossible Finance interaction monitor",
  description: "Dangerous Interaaction detected",
  alertId: "impossible-dangerous",
  protocol: "Impossible Finance",
  severity: FindingSeverity.High,
  type: FindingType.Suspicious,
  metadata: {
    impossibleAddresses: impossible.toString(),
    dangerousAddresses: dangerous.toString(),
  }
});


export const provideHandleTransaction = (
  impossibleVerifier: Verifier,
  dangerousVerifier: Verifier, 
): HandleTransaction => async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  const impossibleInteraction: string[] = [];
  const dangerousInteraction: string[] = [];
  await Promise.all(Object.keys(txEvent.addresses).map(
    async (involvedAddress: string) => {
      const [i, d] = await Promise.all([
        impossibleVerifier(involvedAddress),
        dangerousVerifier(involvedAddress),
      ]);
      if(i) impossibleInteraction.push(involvedAddress);
      if(d) dangerousInteraction.push(involvedAddress);
    }
  ));

  if(impossibleInteraction.length && dangerousInteraction.length)
    findings.push(createFinding(impossibleInteraction, dangerousInteraction))

  return findings;
};


export default {
  handleTransaction: provideHandleTransaction(
    IMPOSSIBLE_VERIFIER,
    DANGEROUS_VERIFIER,
  ),
};
