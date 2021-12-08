import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { utils } from 'ethers';
import {
  provideEventCheckerHandler,
  FindingGenerator,
  decodeParameters
} from "forta-agent-tools";


// Event signature found in Factory.vy in Curve repo
/*
export const DEPLOY_META_POOL_SIGNATURE =
  "MetaPoolDeployed(address,address,uint256,uint256,address)";
*/

const CURVE_FACTORY_ADDRESS: string = "0x0959158b6040D32d04c301A72CBFD6b39E21c9AE";

export const metaPoolAbi: string = 'event MetaPoolDeployed(address,address,uint256,uint256,address)';
export const FACTORY_IFACE: utils.Interface = new utils.Interface([
  metaPoolAbi,
]);

const createFindingGenerator = (alertId: string): FindingGenerator => {

  console.log("Made it to the very beginning of createFindingGenerator");

  return (metadata: { [key: string]: any } | undefined): Finding => {
    const output = decodeParameters(
      ["address","address","uint256", "uint256", "address"],
      metadata?.data
    );

    return Finding.fromObject({
      name: "Deploy Meta Pool Event",
      description: "New meta pool is deployed",
      alertId: alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Unknown,
      metadata:{
        coin: output[0],
        basePool: output[1],
        a: output[2],
        fee: output[3],
        deployer: output[4]
      },
    });
  };
};

export function provideMetaPoolDeployment(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const handler = provideEventCheckerHandler(
      createFindingGenerator(alertID),
      FACTORY_IFACE.getEvent('MetaPoolDeployed').format('sighash'),
      address
    );
    const findings: Finding[] = await handler(txEvent);
    return findings;
  };
}

export default {
  handleTransaction: provideMetaPoolDeployment(
    "CURVE-9",
    CURVE_FACTORY_ADDRESS,
  )
};