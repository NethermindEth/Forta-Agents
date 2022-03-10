import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber } from "ethers";

const FLEXA_COLLATERAL_MANAGER: string = "0x706d7f8b3445d8dfc790c524e3990ef014e7c578";
export const WITHDRAWAL_ROOT_HASH_ADDITION_SIGNATURE: string =
  "event WithdrawalRootHashAddition(bytes32 indexed rootHash, uint256 indexed nonce)";

export const provideHandleTransaction = (address: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const withdrawalRootHashAdditionEvents = txEvent.filterLog(WITHDRAWAL_ROOT_HASH_ADDITION_SIGNATURE, address);
    const time = new Date(txEvent.timestamp * 1000);

    for (let i = 0; i < withdrawalRootHashAdditionEvents.length; i++) {
      findings.push(
        Finding.fromObject({
          name: "Flexa Withdrawal Root Hash alert",
          description: "A new withdrawal root hash is added to the active set",
          alertId: "FLEXA-4",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Flexa",
          metadata: {
            timestamp: txEvent.timestamp.toString(),
            timeUTC: time.toUTCString(),
            rootHash: withdrawalRootHashAdditionEvents[i].args.rootHash,
            nonce: BigNumber.from(withdrawalRootHashAdditionEvents[i].args.nonce).toString()
          }
        })
      );
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(FLEXA_COLLATERAL_MANAGER)
};
