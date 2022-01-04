import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { Interface } from "@ethersproject/abi";

const TREASURY_ABI: string[] = [
  "event Deposit( address indexed token, uint amount, uint value )",
  "event Withdrawal( address indexed token, uint amount, uint value )",
];

const TEST_IFACE: Interface = new Interface([
  ...TREASURY_ABI,
  "event TestEvent( address indexed token, uint amount, uint value )",
]);

const depositFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury High tokens movement detected",
  description: "High Deposit",
  alertId: "olympus-treasury-5-1",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "OlympusDAO",
  metadata: {
    token: log.args['token'].toLowerCase(),
    amount: log.args['amount'].toString(),
    value: log.args['value'].toString(),
  }
});

const withdrawalFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury High tokens movement detected",
  description: "High Withdrawal",
  alertId: "olympus-treasury-5-2",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "OlympusDAO",
  metadata: {
    token: log.args['token'].toLowerCase(),
    amount: log.args['amount'].toString(),
    value: log.args['value'].toString(),
  }
});

const findingsMap: Record<string, (_: LogDescription) => Finding> = {
  "Deposit": depositFinding,
  "Withdrawal": withdrawalFinding,
};

const createFinding = (log: LogDescription): Finding => findingsMap[log.name](log);

export default {
  TREASURY_ABI,
  TEST_IFACE,
  createFinding,
};
