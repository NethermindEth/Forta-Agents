import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import { stablePoolInterface } from "./abi";

const CURVE_POOL_OWNER = "0xeCb456EA5365865EbAb8a2661B0c503410e9B347";

export const createFinding = (functionCallInfo: any): Finding => {
  return Finding.fromObject({
    name: "UnkillMe Agent",
    description: "Pool Owner called unkill_me method",
    alertId: "CURVE-12",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Curve Finance",
    metadata: {
      UnkillPool: functionCallInfo.to,
    },
  });
};

export const provideHandleTransaction = (
  poolOwnerAddress: string
): HandleTransaction =>
  provideFunctionCallsDetectorHandler(
    createFinding,
    stablePoolInterface.getFunction("unkill_me").format(),
    { from: poolOwnerAddress }
  );

export default {
  handleTransaction: provideHandleTransaction(CURVE_POOL_OWNER),
};
