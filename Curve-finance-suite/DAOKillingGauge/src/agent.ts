import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import { gaugeInterface } from "./abi";

export const createFinding = (callInfo: any) => {
  return Finding.fromObject({
    name: "DAO killing Gauge",
    description: "DAO account killed a Gauge",
    alertId: "curve-6",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    protocol: "Curve Finance",
    metadata: {
      gaugeKilled: callInfo.to,
    },
  });
};

export const providerHandleTransaction = (daoAddress: string) =>
  provideFunctionCallsDetectorHandler(
    createFinding,
    gaugeInterface.getFunction("set_killed").format("sighash"),
    {
      from: daoAddress,
      filterOnArguments: (args) => args[0],
    }
  );

export default {
  handleTransaction: providerHandleTransaction(""),
};
