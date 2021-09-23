import { 
  getJsonRpcUrl,
  HandleBlock, 
  HandleTransaction, 
} from 'forta-agent'
import Web3 from "web3";
import { argsToSet, Set } from "./utils";  
import { provideHatChecker } from "./new.hat";
import { provideLiftEventsListener } from "./lift.events";

const MCD_ADM: string = "0x0a3f6849f78076aefaDf113F5BED87720274dDC0";
const knownAddress: Set = argsToSet(); //TODO: Add the knowAddress
const web3Call = new Web3(getJsonRpcUrl()).eth.call;

const handleBlock: HandleBlock = provideHatChecker(web3Call, "MakerDAO-GM-1", MCD_ADM, knownAddress);
const handleTransaction: HandleTransaction = provideLiftEventsListener("MakerDAO-GM-2", MCD_ADM, knownAddress);

export default {
  handleTransaction,
  handleBlock,
}
