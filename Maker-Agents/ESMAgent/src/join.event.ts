import { FindingGenerator, provideEventCheckerHandler } from "forta-agent-tools";
import { BigNumber } from "ethers";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  LogDescription,
} from "forta-agent";

export const MAKER_ESM_JOIN_EVENT_ABI = "event Join(address indexed usr, uint256 wad)";
export const MAKER_ESM_JOIN_EVENT_SIGNATURE = "Join(address,uint256)";

// Filter for amounts greater than the 2 MKR threshold
const filterLog = (log: LogDescription, index?: number | undefined, array?: LogDescription[] | undefined): boolean => {
  const amount: BigNumber = BigNumber.from(log.args[1]);
  const threshold: BigNumber = BigNumber.from("2000000000000000000"); // 2 MKR
  // To run the txn in the README, comment the line above
  // and uncomment the line below (0.0002 MKR threshold)
  // const threshold: BigNumber = BigNumber.from("200000000000000"); // 0.0002 MKR

  return amount.gt(threshold);
};

const createFindingGenerator = (_alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding =>
    Finding.fromObject({
      name: "Maker ESM Join Event",
      description: "Greater than 2 MKR is sent to ESM contract.",
      alertId: _alertID,
      protocol: "Maker",
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
      metadata: {
        usr: metadata!.args[0],
        amount: metadata!.args[1].toString(),
      },
    });
};

const provideESMJoinEventAgent = (_alertID: string, _contractAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(_alertID),
      MAKER_ESM_JOIN_EVENT_ABI,
      _contractAddress,
      filterLog
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMJoinEventAgent;
