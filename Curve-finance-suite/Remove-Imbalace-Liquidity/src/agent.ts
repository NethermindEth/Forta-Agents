import { ethers } from 'ethers';
import { 
  Finding, 
  HandleTransaction, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import {
  decodeParameters,
  FindingGenerator,
  provideEventCheckerHandler,
} from "forta-agent-tools";

export const CONTRACT_ADDRESS = '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7';
const abi = ["event RemoveLiquidityImbalance(address,uint256[3],uint256[3],uint256,uint256)"];
export const iface = new ethers.utils.Interface(abi); 

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) => {
    const {3:token_supply} = decodeParameters(
      ["uint256[3]","uint256[3]","uint256", "uint256"],
      metadata!.data
      );
    
    return Finding.fromObject({
      name: "RemoveLiquidityImbalance event Detected",
      description: 'RemoveLiquidityImbalance event emitted',
      alertId: alertID,
      severity: FindingSeverity.Low,
      type: FindingType.Info,
      protocol: 'Curve Finance',
      metadata: {
        pool_address: metadata!.address, //address of the pool where the event was emitted
        token_supply: token_supply, // token_supply in the pool after removing liquidity
      },
    });
  };
};

export const provideRemoveLiquidityImbalanceAgent = (
  alertID: string,
  address: string
): HandleTransaction => provideEventCheckerHandler(
    createFindingGenerator(alertID),
    iface.getEvent('RemoveLiquidityImbalance').format('sighash'),
    address
  );

export default {
  handleTransaction: provideRemoveLiquidityImbalanceAgent(
    "CURVE-2",
    CONTRACT_ADDRESS
  ),
}