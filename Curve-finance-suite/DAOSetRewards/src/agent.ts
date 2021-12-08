import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import { gaugeInterface } from "./abi";

const curveDAO = "0x519AFB566c05E00cfB9af73496D00217A630e4D5";

export const createFinding = (callInfo: any): Finding => {
  return Finding.fromObject({
    name: "DAO Set Gauge Rewards",
    description: "Curve DAO try to set Gauge Rewards Options",
    alertId: "CURVE-11",
    protocol: "Curve Finance",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      gauge: callInfo.to,
      rewardContract: callInfo.arguments[0],
      sigs: callInfo.arguments[1],
      rewardToken: callInfo.arguments[2].toString(),
    },
  });
};

export const provideHandleTransaction = (daoCurve: string): HandleTransaction =>
  provideFunctionCallsDetectorHandler(
    createFinding,
    gaugeInterface.getFunction("set_rewards").format("sighash"),
    { from: daoCurve }
  );

export default {
  handleTransaction: provideHandleTransaction(curveDAO),
};
