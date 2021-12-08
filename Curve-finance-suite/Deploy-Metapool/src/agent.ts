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
  return (metadata: { [key: string]: any } | undefined): Finding => {
    
    console.log("The metadata passed to createFindingGenerator is: " + JSON.stringify(metadata));

    const decodedData = decodeParameters(
      ["address","address","uint256", "uint256", "address"],
      metadata?.data
    );

    console.log("The decoded metadata.data is: " + JSON.stringify(decodedData));

    return Finding.fromObject({
      name: "Deploy Meta Pool Event",
      description: "New meta pool is deployed",
      alertId: alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Unknown,
      metadata:{
        coin: decodedData[0],
        basePool: decodedData[1],
        a: decodedData[2],
        fee: decodedData[3],
        deployer: decodedData[4]
      },
    });
  };
};

const eventSig: string = 'MetaPoolDeployed(address,address,uint256,uint256,address)';

export function provideMetaPoolDeployment(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {

    let findings: Finding[] = [];

    if(txEvent.logs[0].address == address) {
      
      const handler = provideEventCheckerHandler(
        createFindingGenerator(alertID),
        eventSig,
        // FACTORY_IFACE.getEvent('MetaPoolDeployed').format('sighash'),
        address
      );

      findings = await handler(txEvent);
      return findings;
    } else {
      return findings;
    }
  };
}

export default {
  handleTransaction: provideMetaPoolDeployment(
    "CURVE-9",
    CURVE_FACTORY_ADDRESS,
  )
};