import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  LogDescription
} from 'forta-agent';

const PGL_CONTRACT: string = "0xE530dC2095Ef5653205CF5ea79F8979a7028065c";
const SWAP_ABI: string = "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)";

export const createFinding = (log: LogDescription) => {
  return Finding.fromObject({
    name: 'Flash Swap Alert', // Should be 'Flash Swap Alert'?
    description: 'Flash swap detected on PGL contract.',
    alertId: "BENQI-9",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi",
    metadata: {},
  });
};

export const provideHandleTransaction = (pglContract: string): HandleTransaction =>
async (txEvent: TransactionEvent): Promise<Finding[]> => {
  const findings: Finding[] = [];

  const logs: LogDescription[] = txEvent.filterLog(SWAP_ABI, pglContract);

  // if logs meet criteria for flash swap, create Findings
  // Criteria:
  //    1. `Swap` function call param `data` has `length > 0`.

  return findings;
}

export default {
  handleTransaction: provideHandleTransaction(PGL_CONTRACT)
}