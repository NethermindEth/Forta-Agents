import { BigNumber } from "ethers";
import HatFetcher from "./hat.fetcher";
import { AddressManager } from "./utils";
import ListManager from "./address.list.manager";
import provideHatChecker from "./new.hat";
import DeployedAddressesManager from "./deployed.addresses.manager";
import provideLiftEventsListener from "./lift.events";
import { BlockEvent, Finding, getEthersProvider, HandleBlock, HandleTransaction } from "forta-agent";
import config from "./config";

const SPELLS_MANAGER: AddressManager = new DeployedAddressesManager(config.SPELL_DEPLOYER, getEthersProvider());
const LIFTER_MANAGER: ListManager = new ListManager(config.KNOWN_LIFTERS);

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
  handleTransaction: provideHandleTransaction(config.CHIEF_CONTRACT, SPELLS_MANAGER, LIFTER_MANAGER),
  handleBlock: provideHandleBlock(config.MKR_THRESHOLD, SPELLS_MANAGER, new HatFetcher(config.CHIEF_CONTRACT, getEthersProvider())),
};
