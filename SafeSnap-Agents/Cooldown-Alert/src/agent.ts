import { 
  BlockEvent,
  Finding, 
  HandleBlock,
  HandleTransaction,
  FindingSeverity, 
  FindingType,
  getEthersProvider,
  TransactionEvent,
  Initialize
} from "forta-agent";
import {
  propQuestionCreateAbi,
} from "./abi";
import DataFetcher from "./data.fetcher";

const MODULE_ADDRESS: string = "0x0eBaC21F7f6A6599B5fa5f57Baaa974ADFEC4613".toLowerCase();
const FETCHER: DataFetcher = new DataFetcher(MODULE_ADDRESS, getEthersProvider());
let oracleAddress: string = "";

let questionIds: string[] = [];

/*
// NOTE: COULDN'T GET IT TO WORK
// BY SETTING ITS TYPE TO Initialize
// FROM THE SDK
const initialize = (): Initialize => {
  oracleAddress = FETCHER.getOracle(blockEvent.blockNumber);
}
*/

export const provideHandleTransaction = (
  moduleAddress: string,
  questionIds: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    console.log("questionIds.length in provideHandleTransaction before filterLog is: " + questionIds.length);

    txEvent.filterLog(propQuestionCreateAbi, moduleAddress)
      .map(event => questionIds.push(event.args[0]));

      console.log("questionIds.length in provideHandleTransaction after filterLog is: " + questionIds.length);

    return findings;
  }
}

const createFinding = (
  questionId: string,
  questionFinalizeTS: number,
  blockNumber: number
): Finding => {
  return Finding.fromObject({
    name: "Cooldown Alert",
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

    console.log("questionIds.length in provideHandleBlock before for loop is: " + questionIds.length);
    console.log("questionIds before in provideHandleBlock for loop is: " + questionIds);

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
        console.log("questionIds right before splice is: " + questionIds);
        questionIds.splice(id, 1);
        console.log("questionIds right after splice is: " + questionIds);
        console.log("questionIds.length right after splice is: " + questionIds.length);
        // Decrement id to make up
        // for questionIds.length
        // decreasing after splice
        id--;
      }
    }

    console.log("questionIds.length after splice, outside of for loop, is: " + questionIds.length);

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    MODULE_ADDRESS,
    questionIds
  ),
  handleBlock: provideHandleBlock(
    FETCHER,
    oracleAddress,
    questionIds
  )
}