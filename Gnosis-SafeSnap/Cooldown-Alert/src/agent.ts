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

const REALITIO_ERC20: string = "0x8f1CC53bf34932591177CDA24723486205CA7510".toLowerCase();
const DAO_MODULE: string = "0x1c511d88ba898b4D9cd9113D13B9c360a02Fcea1".toLowerCase();
const FETCHER: DataFetcher = new DataFetcher(
  REALITIO_ERC20, 
  getEthersProvider(),
)

let questionIds: string[] = [];

export const provideHandleTransaction = (
  daoModuleAddress: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog(propQuestionCreateAbi, daoModuleAddress)
      .map(event => questionIds.push(event.args[0]));

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
  fetcher: DataFetcher
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    for(let id = 0; id < questionIds.length; id++) {
      const finalizeTS: number = await fetcher.getFinalizeTS(
        blockEvent.blockNumber,
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
      }

      // NOTE: IF ONLY CHECKING WHEN COOLDOWN BEGINS,
      // NO NEED TO WAIT FOR QUESTION EXPIRATION FOR DELETION
      delete questionIds[id];
    }

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    DAO_MODULE
  ),
  handleBlock: provideHandleBlock(
    FETCHER
  )
}