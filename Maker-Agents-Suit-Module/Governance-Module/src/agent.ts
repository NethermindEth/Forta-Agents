import { BigNumber } from "ethers";
import HatFetcher from "./hat.fetcher";
import { AddressManager } from "./utils";
import ListManager from "./address.list.manager";
import provideHatChecker, { MKR_THRESHOLD } from "./new.hat";
import DeployedAddressesManager from "./deployed.addresses.manager";
import provideLiftEventsListener, { KNOWN_LIFTERS } from "./lift.events";
import { BlockEvent, Finding, getEthersProvider, HandleBlock, HandleTransaction } from "forta-agent";

export const SPELL_DEPLOYER: string = "0xda0c0de01d90a5933692edf03c7ce946c7c50445";
export const CHIEF_CONTRACT: string = "0x0a3f6849f78076aefaDf113F5BED87720274dDC0";

const SPELLS_MANAGER: AddressManager = new DeployedAddressesManager(SPELL_DEPLOYER, getEthersProvider());
const LIFTER_MANAGER: ListManager = new ListManager(KNOWN_LIFTERS);

export function provideHandleTransaction(
  chief: string,
  spellsManager: AddressManager,
  lifterManager: AddressManager
): HandleTransaction {
  return provideLiftEventsListener(
    "MakerDAO-GM-2", 
    chief, 
    spellsManager.isKnownAddress.bind(spellsManager),
    lifterManager.isKnownAddress.bind(lifterManager),
  );
}

export function provideHandleBlock(
  threshold: BigNumber,
  addressManager: AddressManager,
  fetcher: HatFetcher
): HandleBlock {
  const handler: HandleBlock = provideHatChecker(
    "MakerDAO-GM-1",
    addressManager.isKnownAddress.bind(addressManager),
    threshold,
    fetcher
  );
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    // Update the SPELL_DEPLOYER's nonce
    await addressManager.update(blockEvent.blockNumber);
    return handler(blockEvent);
  };
}

export default {
  handleTransaction: provideHandleTransaction(CHIEF_CONTRACT, SPELLS_MANAGER, LIFTER_MANAGER),
  handleBlock: provideHandleBlock(MKR_THRESHOLD, SPELLS_MANAGER, new HatFetcher(CHIEF_CONTRACT, getEthersProvider())),
};
