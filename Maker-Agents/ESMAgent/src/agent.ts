import provideESMJoinEventAgent from "./join.event";
import provideESMFireEventAgent from "./fire.event";
import { Finding, Initialize, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { Contract, providers, utils } from "ethers";

const MakerDAO_CHANGELOG_ADDRESS: string = "0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F";
const ESM_CONTRACT_BYTES: string = utils.formatBytes32String("MCD_ESM");
let MakerDAO_ESM_ADDRESS: string = "";

const JOIN_EVENT_ALERTID: string = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID: string = "MakerDAO-ESM-2";

const provideInitialize = (address: string, bytes: string, provider: providers.Provider): Initialize => {
  return async function initialize() {
    const changeLogContract: Contract = new Contract(
      address,
      new utils.Interface(["function getAddress(bytes32 _key) public view returns (address addr)"]),
      provider
    );
    MakerDAO_ESM_ADDRESS = await changeLogContract.getAddress(bytes);
  };
};

const provideAgentHandler = (esmAddress: string, joinEvent: string, fireEvent: string): HandleTransaction => {
  const joinEventHandler = provideESMJoinEventAgent(joinEvent, esmAddress);
  const fireEventHandler = provideESMFireEventAgent(fireEvent, esmAddress);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    findings = [...(await joinEventHandler(txEvent)), ...(await fireEventHandler(txEvent))];

    return findings;
  };
};

export default {
  provideInitialize,
  intialize: provideInitialize(MakerDAO_CHANGELOG_ADDRESS, ESM_CONTRACT_BYTES, getEthersProvider()),
  provideAgentHandler,
  handleTransaction: provideAgentHandler(MakerDAO_ESM_ADDRESS, JOIN_EVENT_ALERTID, FIRE_EVENT_ALERTID),
};
