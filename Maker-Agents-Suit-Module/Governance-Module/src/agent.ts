import { 
  getJsonRpcUrl,
  HandleBlock, 
  HandleTransaction, 
} from 'forta-agent'
import Web3 from "web3";
import { AddressVerifier, generateAddressVerifier } from "./utils";  
import provideHatChecker from "./new.hat";
import provideLiftEventsListener from "./lift.events";
import knownAddresses from './known.addresses';

export const CHIEF_CONTRACT: string = "0x0a3f6849f78076aefaDf113F5BED87720274dDC0";
const web3Call = new Web3(getJsonRpcUrl()).eth.call;

//TODO: Needs to be implemented after MakerDAO decides how to provide the addresses 
const isAddressKnown: AddressVerifier = generateAddressVerifier(...knownAddresses); // Beta Implementation

export const handleTransaction: HandleTransaction =
  provideLiftEventsListener("MakerDAO-GM-2", CHIEF_CONTRACT, isAddressKnown);

export const handleBlock: HandleBlock =
  provideHatChecker(web3Call, "MakerDAO-GM-1", CHIEF_CONTRACT, isAddressKnown);

export default {
  handleTransaction,
  handleBlock,
}
