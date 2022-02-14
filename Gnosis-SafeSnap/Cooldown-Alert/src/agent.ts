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
  Contract,
  providers,
  BigNumber,
  FixedNumber
} from "ethers";
import {
  realitioIFace,
  propQuestionCreateAbi,
} from "./abi";

const REALITIO_ERC20: string = "0x8f1CC53bf34932591177CDA24723486205CA7510".toLowerCase();
const DAO_MODULE: string = "0x1c511d88ba898b4D9cd9113D13B9c360a02Fcea1".toLowerCase();

export const testQuestionId: BigNumber = BigNumber.from("0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02"); // NOTE: ONLY IN HERE FOR TESTING. PULLED IT FROM REALITY.ETH

let questionIds: string[] = [];

export const getFinalizeTS = async ( // NOTE: ONLY EXPORTING FOR TESTING
  realitioAddress: string,
  provider: providers.Provider,
  blockNumber: number,
  questionId: BigNumber
)/*: Promise<any>confirm what it is supposed to return*/ => {
  const realitioContract = new Contract(realitioAddress, realitioIFace, provider);
  // console.log("questionId is: " + questionId);
  /*return*/ console.log(await realitioContract.getFinalizeTS(questionId, { blockTag: blockNumber })); // NOTE: THE ERROR IS FROM CALLING THE FUNCTION IN THE CONTRACT
};

export const provideHandleTransaction = (
  daoModuleAddr: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog(propQuestionCreateAbi, daoModuleAddr)
      .map(event => questionIds.push(event.args[0]));

    return findings;
  }
}

// NOTE: INCLUDE A QUESTION'S COOLDOWN
// IN THE METADATA?
const createFinding = (
  questionId: string,
  questionFinalizeTS: number,
  blockNumber: number
): Finding => {
  return Finding.fromObject({
    name: "Cooldown Alert",
    description: "A question's cooldown period has begun",
    alertId: "GNOSIS-2",
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
  realitioAddress: string,
  provider: providers.Provider
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const finalizeTS = await getFinalizeTS(
      realitioAddress,
      provider,
      blockEvent.blockNumber,
      testQuestionId
    );

    console.log("finalizeTS is: " + finalizeTS);

    /*
    for(let id = 0; id < questionIds.length; id++) {
      const finalizeTS = await getFinalizeTS(
        realitioAddress,
        provider,
        blockEvent.block.number,
        questionIds[id]
      );
      if(finalizeTS > blockEvent.blockNumber) {
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
      questionIds[id] = "";
    }
    */

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    DAO_MODULE
  ),
  handleBlock: provideHandleBlock(
    REALITIO_ERC20,
    getEthersProvider(),
  )
}