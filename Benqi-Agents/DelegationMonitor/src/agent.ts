import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  ethers,
  HandleTransaction,
} from "forta-agent";
import { BigNumber, providers, utils } from "ethers";
import LRU from "lru-cache";
import util from "./utils";

const QI_CONTRACT: string = "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5";
const AMOUNT_THRESHOLD: BigNumber = utils.parseEther("10000000.0");

export const createFinding = (
  delegator: string,
  fromDelegate: string,
  toDelegate: string,
  balance: BigNumber
): Finding => {
  return Finding.fromObject({
    name: "Large votes delegation detected",
    description: "Detect user with a huge balance delegating their votes",
    alertId: "BENQI-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      delegator: delegator.toLowerCase(),
      fromDelegate: fromDelegate.toLowerCase(),
      toDelegate: toDelegate.toLowerCase(),
      balance: balance.toString(),
    },
  });
};

export function provideHandleTransaction(
  amountThreshold: BigNumber,
  QiToken: string,
  provider: providers.Provider
): HandleTransaction {
  const cache: LRU<string, BigNumber> = new LRU<string, BigNumber>({
    max: 10000,
  });

  const BenqiContract = new ethers.Contract(QiToken, util.BALANCE_OF_FUNCTION, provider);
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const delegateChangedEvents = txEvent.filterLog(util.DELEGATE_CHANGED_EVENT, QiToken);
    await Promise.all(
      delegateChangedEvents.map(async (event) => {
        const delegator: string = event.args.delegator;
        const blockNumber: number = txEvent.blockNumber;
        const key: string = `${delegator}-${blockNumber}`;

        let balanceOfDelegator: BigNumber;
        if (cache.has(key)) {
          balanceOfDelegator = cache.get(key) as BigNumber;
        } else {
          balanceOfDelegator = await BenqiContract.balanceOf(delegator, {
            blockTag: txEvent.blockNumber,
          });
          cache.set(key, balanceOfDelegator);
        }

        if (balanceOfDelegator.gte(amountThreshold)) {
          const newFinding: Finding = createFinding(
            event.args.delegator,
            event.args.fromDelegate,
            event.args.toDelegate,
            balanceOfDelegator
          );
          findings.push(newFinding);
        }
      })
    );

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(AMOUNT_THRESHOLD, QI_CONTRACT, getEthersProvider()),
};
