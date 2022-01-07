import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent'
import { createFinding } from "./utils";

export const FUNCTION_ABIS = [
  "function addRecipient(address _recipient, uint256 _rewardRate)",
  "function removeRecipient(uint256 _index, address _recipient)",
  "function setAdjustment(uint256 _index, bool _add, uint256 _rate, uint256 _target)",
];

const STAKE_CONTRACT_ADDRESS = "0xc58e923bf8a00e4361fe3f4275226a543d7d3ce6";

export const provideHandleTransaction = (functionABIS: string[], stakeContract: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const calledFunctions: string[] = [];

    functionABIS.forEach((functionABI: string) => {
      const messages = txEvent.filterFunction(functionABI, stakeContract);
      if (messages.length > 0) {
        calledFunctions.push(messages[0].name);
      }
    });

    return calledFunctions.map(createFinding);
  };
}


export default {
  handleTransaction: provideHandleTransaction(FUNCTION_ABIS, STAKE_CONTRACT_ADDRESS),
}
