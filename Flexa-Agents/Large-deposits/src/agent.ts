import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  ethers,
} from "forta-agent";
import { BigNumber, utils, providers } from "ethers";
import PriceFetcher from "./price.fetcher";

import util from "./utils";
const AMOUNT_THRESHOLD: BigNumber = BigNumber.from(10 ** 6); // 1M USD
const AMOUNT_CORRECTION: BigNumber = BigNumber.from(10).pow(18);
const PRICE_CORRECTION: BigNumber = BigNumber.from(10).pow(8);
const AMP_TOKEN: string = "0xfF20817765cB7f73d4bde2e66e067E58D11095C2";
const FLEXA_CONTRACT: string = "0x706D7F8B3445D8Dfc790C524E3990ef014e7C578";

const createFinding = (
  amount: BigNumber,
  partition: string,
  operator: string,
  from: string,
  destinationPartition: string,
  to: string,
  operatorData: string
): Finding => {
  return Finding.fromObject({
    name: "Large Deposit",
    description: "Large Deposit into staking pool",
    alertId: "FLEXA-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa",
    metadata: {
      value: amount.toString(),
      fromPartition: partition.toLowerCase(),
      operator: operator.toLowerCase(),
      from: from.toLowerCase(),
      destinationPartition: destinationPartition.toLowerCase(),
      to: to.toLowerCase(),
      operatorData: operatorData.toLowerCase(),
    },
  });
};

export function provideHandleTransaction(
  amountThreshold: BigNumber,
  ampToken: string,
  flexaManager: string,
  provider: providers.Provider,
  fetcher: PriceFetcher
) {
  const flexaStakingContract = new ethers.Contract(
    flexaManager,
    util.COLLATERAL_MANAGER,
    provider
  );
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    // filter the transaction logs for transferByPartition events
    const transferByPartitionEvents = txEvent.filterLog(
      util.AMP_TOKEN,
      ampToken
    );

    if(transferByPartitionEvents.length === 0)
      return findings;

    const priceFeed: BigNumber[] = await fetcher.getAmpPrice(
      txEvent.blockNumber,
      util.CHAINLINK_AMP_DATA_FEED
    );
    let tokenPrice = priceFeed[1];

    // fire alerts for transfers of large stake
    await Promise.all(
      transferByPartitionEvents.map(async (event) => {
        const data = event.args.data;
        const value = event.args.value;
        
        let decodedPartition: string;

        if (data.length < 128) {
          decodedPartition = event.args.fromPartition;
        } else {
          [, decodedPartition] = utils.defaultAbiCoder.decode(
            ["bytes32", "bytes32"],
            data
          );
        }

        const isValidPartition = await flexaStakingContract.partitions(
          decodedPartition,
          { blockTag: txEvent.blockNumber }
        );

        if (
          isValidPartition &&
          value.mul(tokenPrice).gte(amountThreshold.mul(AMOUNT_CORRECTION).mul(PRICE_CORRECTION))
        ) {
          const newFinding: Finding = createFinding(
            event.args.value,
            event.args.fromPartition,
            event.args.operator,
            event.args.from,
            decodedPartition,
            event.args.to,
            event.args.operatorData
          );
          findings.push(newFinding);
        }
      })
    );

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    AMOUNT_THRESHOLD,
    AMP_TOKEN,
    FLEXA_CONTRACT,
    getEthersProvider(),
    new PriceFetcher(getEthersProvider())
  ),
};
