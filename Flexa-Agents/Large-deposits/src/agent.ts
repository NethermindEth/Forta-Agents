import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  ethers,
} from "forta-agent";
import { BigNumber, utils, providers } from "ethers";
import abi from "./abi";

const AMOUNT_THRESHOLD = utils.parseEther("1").mul(1e6); // 1 million
const AMP_TOKEN: string = "0xfF20817765cB7f73d4bde2e66e067E58D11095C2";
const FLEXA_CONTRACT: string = "0x706D7F8B3445D8Dfc790C524E3990ef014e7C578";

export const createFinding = (
  amountThreshold: BigNumber,
  amount: BigNumber,
  partition: string,
  operator: string,
  from: string,
  destinationPartition: string,
  to: string
): Finding => {
  return Finding.fromObject({
    name: "Large Deposit",
    description: "Large Deposit into staking pool",
    alertId: "FLEXA-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      amountThreshold: amountThreshold.toString(),
      value: amount.toString(),
      fromPartition: partition.toLocaleLowerCase(),
      operator: operator.toLocaleLowerCase(),
      from: from.toLocaleLowerCase(),
      destinationPartition: destinationPartition.toLocaleLowerCase(),
      to: to.toLocaleLowerCase(),
    },
  });
};

export function provideHandleTransaction(
  amountThreshold: BigNumber,
  ampToken: string,
  flexaManager: string,
  provider: providers.Provider,
) {
  const flexaStakingContract = new ethers.Contract(
    flexaManager,
    abi.FLEXA_CONTRACT,
    provider,
  );
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    // filter the transaction logs for transferByPartition events
    const transferByPartitionEvents = txEvent.filterLog(
      abi.AMP_TOKEN,
      ampToken
    );

    // fire alerts for transfers of large stake
    await Promise.all(transferByPartitionEvents.map(async (event) => {
      const data = event.args.data;
      const value = event.args.value;

      //derives destinationAddress from data argument
      const [,decodedPartition] = utils.defaultAbiCoder.decode(
        ["bytes32", "bytes32"],
        data,
      );

      const destinationPartitionMapping = await flexaStakingContract.partitions(
        decodedPartition,
        { blockTag: txEvent.blockNumber },
      );


      if (destinationPartitionMapping) {
        if (value.gte(amountThreshold)) {
          const newFinding: Finding = createFinding(
            amountThreshold,
            event.args.value,
            event.args.fromPartition,
            event.args.operator,
            event.args.from,
            decodedPartition,
            event.args.to
          );
          findings.push(newFinding);
        }
      }
    }));

    return findings;
  };
}


export default {
  handleTransaction: provideHandleTransaction(
    AMOUNT_THRESHOLD,
    AMP_TOKEN,
    FLEXA_CONTRACT,
    getEthersProvider(),
  ),
};
