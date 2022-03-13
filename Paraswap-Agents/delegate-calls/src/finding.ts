import { Finding, FindingType, FindingSeverity, TransactionEvent, HandleTransaction } from "forta-agent";

export const createFinding = (hasRouterRole: boolean | undefined, logicContract: string) => {
  let desc;
  let alertId;
  let findingSeverity;
  let findingType;
  switch (hasRouterRole) {
    case true:
      desc = "A delegated call has been made to a trusted contract";
      alertId = "PARASWAP-3-1";
      findingSeverity = FindingSeverity.Info;
      findingType = FindingType.Info;
      break;
    case false:
      desc = "A delegated call has been made to an unknown contract";
      alertId = "PARASWAP-3-2";
      findingSeverity = FindingSeverity.High;
      findingType = FindingType.Exploit;
      break;
    default:
      desc =
        "A delegated call has been made to a potentially unknown contract. " +
        "On-chain check if contract has `ROUTER_ROLE` failed";
      alertId = "PARASWAP-3-3";
      findingSeverity = FindingSeverity.Medium;
      findingType = FindingType.Suspicious;
  }

  return Finding.fromObject({
    name: "Delegated Function Call Detected",
    description: desc,
    alertId: alertId,
    severity: findingSeverity,
    type: findingType,
    protocol: "Paraswap",
    metadata: {
      logicContract: logicContract,
    },
  });
};
