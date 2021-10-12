import { 
  BlockEvent,
  Finding,
  getJsonRpcUrl,
  HandleBlock, 
  HandleTransaction, 
} from 'forta-agent'
import Web3 from "web3";
import { AddressVerifier } from "./utils";  
import provideHatChecker from "./new.hat";
import provideLiftEventsListener from "./lift.events";
import DeployedAddressesManager from './deployed.addresses.manager';

export const SPELL_DEPLOYER: string = "0xda0c0de01d90a5933692edf03c7ce946c7c50445";
export const CHIEF_CONTRACT: string = "0x0a3f6849f78076aefaDf113F5BED87720274dDC0";
const _web3 = new Web3(getJsonRpcUrl());

const addressManager: DeployedAddressesManager = 
  new DeployedAddressesManager(SPELL_DEPLOYER, _web3.eth.getTransactionCount);

const isAddressKnown: AddressVerifier = 
  (addr: string): boolean => 
    addressManager.isDeployedAddress(addr);

export const handleTransaction: HandleTransaction =
  provideLiftEventsListener("MakerDAO-GM-2", CHIEF_CONTRACT, isAddressKnown);

export function provideHandleBlock(web3Call: any): HandleBlock {
  const handler: HandleBlock = provideHatChecker(web3Call, "MakerDAO-GM-1", CHIEF_CONTRACT, isAddressKnown);
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    // Update the SPELL_DEPLOYER's nonce
    await addressManager.update(blockEvent.blockNumber);
    return handler(blockEvent);
  };
};

export default {
  handleTransaction,
  handleBlock: provideHandleBlock(_web3.eth.call),
}
