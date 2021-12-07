import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import { gaugeInterface } from "./abi";

const curveDAO = "0x519AFB566c05E00cfB9af73496D00217A630e4D5";

export const createFinding = (callInfo: any) => {
  return Finding.fromObject({
    name: "DAO killing Gauge",
    description: "DAO account killed a Gauge",
    alertId: "CURVE-8",
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
  handleTransaction: providerHandleTransaction(curveDAO),
};
