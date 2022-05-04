import { Interface } from "@ethersproject/abi";
import { utils } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import NetWorkData from "./network";

const FUNCTIONS_ABI: string[] = [
  "function setFeeTo(address _feeTo)",
  "function setFeeToSetter(address _feeToSetter)",
];

const FUNCTIONS_IFACE: Interface = new Interface(FUNCTIONS_ABI);

const createFinding = (
  call: utils.TransactionDescription,
  contract: NetWorkData
): Finding => {
  if (call.name == "setFeeTo") {
    return Finding.fromObject({
      name: "ApeFactory FeeTo address changed",
      description: `${call.name} function called in ApeFactory contract.`,
      alertId: "APESWAP-7-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata: {
        feeTo: call.args._feeTo.toLowerCase(),
      },
      addresses: [contract.factory],
    });
  } else
    return Finding.fromObject({
      name: "ApeFactory FeeTo setter address changed",
      description: `${call.name} function called in ApeFactory contract.`,
      alertId: "APESWAP-7-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata: {
        feeToSetter: call.args._feeToSetter.toLowerCase(),
      },
      addresses: [contract.factory],
    });
};

export default {
  FUNCTIONS_ABI,
  FUNCTIONS_IFACE,
  createFinding,
};
