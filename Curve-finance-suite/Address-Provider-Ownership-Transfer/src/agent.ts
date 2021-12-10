import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  ethers,
} from "forta-agent";
import {
  FindingGenerator,
  provideEventCheckerHandler,
} from "forta-agent-tools";

export const ADDRESS = "0x0000000022d53366457f9d5e68ec105046fc4383"; // Address Provider contract address
const abi = ["event CommitNewAdmin(uint256,address)"];
export const iface = new ethers.utils.Interface(abi); 

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) => {
    return Finding.fromObject({
      name: "Curve Admin Event Detected",
      description: "An ownership transfer has been initiated",
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      protocol: 'Curve Finance',
      metadata: {
        newAdmin: metadata!.topics[2],
      },
    });
  };
};

export const provideCommitNewAdminEvent = (
  alertID: string,
  address: string
): HandleTransaction => provideEventCheckerHandler(
      createFindingGenerator(alertID),
      iface.getEvent('CommitNewAdmin').format('sighash'),
      address
    );

export default {
  handleTransaction: provideCommitNewAdminEvent(
    "CURVE-4",
    ADDRESS
  )
};
