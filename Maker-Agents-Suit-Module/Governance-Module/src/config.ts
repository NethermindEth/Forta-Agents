import { BigNumber } from "ethers";

const SPELL_DEPLOYER: string = "0xda0c0de01d90a5933692edf03c7ce946c7c50445";
const CHIEF_CONTRACT: string = "0x0a3f6849f78076aefaDf113F5BED87720274dDC0";
const KNOWN_LIFTERS: string[] = ["0x5cab1e5286529370880776461c53a0e47d74fb63"];
const MKR_THRESHOLD: BigNumber = BigNumber.from(40000);

export default {
  SPELL_DEPLOYER,
  CHIEF_CONTRACT,
  KNOWN_LIFTERS,
  MKR_THRESHOLD,
};
