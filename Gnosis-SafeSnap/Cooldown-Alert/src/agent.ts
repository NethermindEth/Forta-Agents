import { 
  BlockEvent,
  Finding, 
  HandleBlock,
  FindingSeverity, 
  FindingType,
  getEthersProvider
} from "forta-agent";
import {
  ethers,
  providers
} from "ethers";
import {
  daoModuleAbi,
  realitioErc20Abi
} from "./abi";

const REALITIO_ERC20: string = "0x8f1CC53bf34932591177CDA24723486205CA7510".toLowerCase();
const DAO_MODULE: string = "0x1c511d88ba898b4D9cd9113D13B9c360a02Fcea1".toLowerCase();
const QUESTION_COOLDOWN: number = 86400; // 86,400 seconds (i.e. 24 Hours)

let questionIds: number[] = []; // NOTE: BETTER TO USE AS A ARGUMENT?

const createFinding = (
  questionId: number,
  questionFinalizeTS: number,
  cooldownPeriod: number,
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
      questionId: questionId.toString(),
      questionFinalizeTimeStamp: questionFinalizeTS.toString(),
      cooldownPeriod: cooldownPeriod.toString(),
      blockNumber: blockNumber.toString()
    },
  });
};

export const provideHandleBlock = (
  //questionIds: number[],
  realitioErc20: string,
  daoModule: string,
  provider: providers.Provider
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // CHECK FOR ANY TXNS TO addProposalWithNonce
    // OR IF POSSIBLE, ANY ProposalQuestionCreated
    // EVENT EMISSIONS AND PUSH questionId TO questionIds

    const realitioErc20Contract = new ethers.Contract(realitioErc20, realitioErc20Abi, provider);

    for(let id = 0; id < questionIds.length; id++) {
      const questionFinalizeTS: number = realitioErc20Contract.getFinalizeTS(questionIds[id]);

      if(questionFinalizeTS > blockEvent.blockNumber) {
        findings.push(
          createFinding(
            questionIds[id],
            questionFinalizeTS,
            QUESTION_COOLDOWN,
            blockEvent.blockNumber
          )
        );
      }
    }

    // LOOP THROUGH ARRAY OF questionIds AND
    // DELETE ANY THAT ARE NO LONGER NECESSARY
    // (USING EXPIRATION GOOD ENOUGH?)

    return findings;
  }
}

export default {
  handleBlock: provideHandleBlock(
    //123, // FIND REAL questionIds
    REALITIO_ERC20,
    DAO_MODULE,
    getEthersProvider()
  )
}