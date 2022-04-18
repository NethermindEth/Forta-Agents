import { BigNumber } from "ethers";

const CHAINLOG_CONTRACT: string = "0xda0ab1e0017debcd72be8599041a2aa3ba7e740f";
const SPELL_DEPLOYER: string = "0xda0c0de01d90a5933692edf03c7ce946c7c50445";
const KNOWN_LIFTERS: string[] = ["0x5cab1e5286529370880776461c53a0e47d74fb63"];
const MKR_THRESHOLD: BigNumber = BigNumber.from(40000);

export default {
  CHAINLOG_CONTRACT,
  SPELL_DEPLOYER,
  KNOWN_LIFTERS,
  MKR_THRESHOLD,
};
