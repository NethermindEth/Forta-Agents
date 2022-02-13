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
  utils
} from "ethers";
import {
  getFinalizeTSIface,
  propQuestionCreateAbi,
} from "./abi";

const REALITIO_ERC20: string = "0x8f1CC53bf34932591177CDA24723486205CA7510".toLowerCase();
const DAO_MODULE: string = "0x1c511d88ba898b4D9cd9113D13B9c360a02Fcea1".toLowerCase();

export const testQuestionId: string = utils.formatBytes32String("Is this a test?"); // NOTE: ONLY IN HERE FOR TESTING

let questionIds: string[] = [];

export const getFinalizeTS = async ( // NOTE: ONLY EXPORTING FOR TESTING
  realitioAddress: string,
  provider: providers.Provider,
  blockNumber: number,
  questionId: string
): Promise<any>/*confirm what it is supposed to return*/ => {
  const realitioContract = new Contract(realitioAddress, getFinalizeTSIface, provider);
  try {
    // return await realitioContract.getFinalizeTS(questionId, { blockTag: blockNumber  });
    return await realitioContract.createTemplate("content");
  } catch {
    console.log("call to contract failed.");
  }
};

/*
const getShareAmount = async (
  positionManagerAddress: string,
  workerAddress: string,
  pid: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const positionManagerContract = new Contract(
    positionManagerAddress,
    positionManagerInterface,
    provider
  );
  return (
    await positionManagerContract.userInfo(pid, workerAddress, {
      blockTag: blockNumber,
    })
  ).amount;
};
*/

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

/*
export const provideHandleBlock = (
  addressesFetcher: Fetcher,
  percentThreshold: number,
  blockLapse: number,
  provider: providers.Provider
): HandleBlock => {
  let lastBlock = -blockLapse;

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (blockEvent.blockNumber - lastBlock < blockLapse) {
      return [];
    }

    lastBlock = blockEvent.blockNumber;

    const findings: Finding[] = [];

    const registryAddresses = await addressesFetcher(DATA_URL);
    const workerAddresses: string[] = [];

    for (let vault of registryAddresses.vaults) {
      for (let worker of vault.workers) {
        workerAddresses.push(worker.address);
      }
    }

    const percentPromises = workerAddresses.map((worker) =>
      getSharePercent(worker, blockEvent.blockNumber, provider)
    );
    const percents = await Promise.all(percentPromises);

    for (let i = 0; i < workerAddresses.length; i++) {
      if (percents[i].gt(percentThreshold)) {
        findings.push(
          createFinding(workerAddresses[i], percents[i].toString())
        );
      }
    }

    return findings;
  };
};


export const getSharePercent = async (
  workerAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const [pid, lpToken] = await getWorkerData(
    workerAddress,
    blockNumber,
    provider
  );

  if (lpToken === constants.AddressZero) {
    return BigNumber.from(0);
  }
  const positionManager = await getPositionManager(
    workerAddress,
    blockNumber,
    provider
  );
  const shareAmount = await getShareAmount(
    positionManager,
    workerAddress,
    pid,
    blockNumber,
    provider
  );
  const totalSupply = await getTotalSupply(lpToken, blockNumber, provider);
  return shareAmount.mul(100).div(shareTotalSupply);
};


const getWorkerData = async (
  workerAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<[string, string]> => {
  const workerContract = new Contract(workerAddress, workerInterface, provider);
  return Promise.all([
    workerContract.pid({ blockTag: blockNumber }),
    workerContract.lpToken({ blockTag: blockNumber }),
  ]);
};


when(mockCall)
  .calledWith(isCallToPid(workers[0]), expect.anything())
  .mockReturnValue(encodeParameter("uint256", 1));


*/