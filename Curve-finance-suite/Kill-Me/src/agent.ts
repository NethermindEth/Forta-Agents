import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  ethers,
} from 'forta-agent';
import { 
  FindingGenerator, 
  provideFunctionCallsDetectorHandler,
} from "forta-agent-tools";

export const STABLE_SWAP_CONTRACT_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; //3Pool Stable Swap Contract  
const abi = ["function kill_me()"];
export const iface = new ethers.utils.Interface(abi); 

const createFindingGenerator = (alertId: string, address: string): FindingGenerator => 
  (metadata: { [key: string]: any } | undefined): Finding => 
    Finding.fromObject({
      name: 'Kill Me function call Detected',
      description: 'Kill Me function called on Curve-Stable-Swap contract.',
      alertId: alertId,
      severity: FindingSeverity.Low,
      type: FindingType.Suspicious,
      metadata: {
        from: metadata!.from,
        contract_address: address,    
    },
  });
  
export const provideKillMeAgent = (
  alertID: string,
  address: string
): HandleTransaction => provideFunctionCallsDetectorHandler(
    createFindingGenerator(alertID, address), 
    iface.getFunction('kill_me').format('sighash'), 
    {
      to: address,
    }
);
  
export default {
  handleTransaction: provideKillMeAgent(
    "CURVE-6", 
    STABLE_SWAP_CONTRACT_ADDRESS,
  )
};