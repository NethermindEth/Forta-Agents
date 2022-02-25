import { 
  BlockEvent,
  Finding, 
  HandleBlock,
  HandleTransaction,
  FindingSeverity, 
  FindingType,
  getEthersProvider,
  TransactionEvent,
} from "forta-agent";
import {
  propQuestionCreateAbi,
} from "./abi";
import DataFetcher from "./data.fetcher";

const MODULE_ADDRESS: string = "0x0eBaC21F7f6A6599B5fa5f57Baaa974ADFEC4613";
const FETCHER: DataFetcher = new DataFetcher(MODULE_ADDRESS, getEthersProvider());
let oracle: string = "";

let questionIds: string[] = [];

const initialize = async () => {
  oracle = await FETCHER.getOracle(await getEthersProvider().getBlockNumber());
};

export const provideHandleTransaction = (
  moduleAddress: string,
  questionIds: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog(propQuestionCreateAbi, moduleAddress)
      .map(event => questionIds.push(event.args[0]));

    return findings;
  };
};

const createFinding = (
  questionId: string,
  questionFinalizeTS: number,
  blockNumber: number
): Finding => {
  return Finding.fromObject({
    name: "SafeSnap Cooldown Alert",
    description: "A question's cooldown period has begun",
    alertId: "SAFESNAP-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Gnosis SafeSnap",
    metadata: {
      questionId: questionId,
      questionFinalizeTimeStamp: questionFinalizeTS.toString(),
      blockNumber: blockNumber.toString()
    },
  });
};

export const provideHandleBlock = (
  fetcher: DataFetcher,
  oracle: string,
  questionIds: string[]
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    for(let id = 0; id < questionIds.length; id++) {
      const finalizeTS: number = await fetcher.getFinalizeTS(
        blockEvent.blockNumber,
        oracle,
        questionIds[id]
      );

      if(blockEvent.blockNumber > finalizeTS) {
        findings.push(
          createFinding(
            questionIds[id],
            finalizeTS,
            blockEvent.blockNumber
          )
        );
        questionIds.splice(id, 1);
        // Decrement id to make up
        // for questionIds.length
        // decreasing after splice
        id--;
      }
    }
    return findings;
  };
};

export default {
  initialize,
  handleTransaction: provideHandleTransaction(
    MODULE_ADDRESS,
    questionIds
  ),
  handleBlock: provideHandleBlock(
    FETCHER,
    oracle,
    questionIds
  )
};
