import { BigNumber, utils } from "ethers";
import HatFetcher from "./hat.fetcher";
import { AddressManager } from "./utils";
import ListManager from "./address.list.manager";
import provideHatChecker from "./new.hat";
import DeployedAddressesManager from "./deployed.addresses.manager";
import provideLiftEventsListener from "./lift.events";
import { BlockEvent, Finding, getEthersProvider, HandleBlock, HandleTransaction, TransactionEvent } from "forta-agent";
import config from "./config";
import { EVENT_ABI } from "./abi";
import AddressFetcher from "./address.fetcher";

const SPELLS_MANAGER: AddressManager = new DeployedAddressesManager(config.SPELL_DEPLOYER, getEthersProvider());
const LIFTER_MANAGER: ListManager = new ListManager(config.KNOWN_LIFTERS);
let CHIEF_FETCHER: AddressFetcher = new AddressFetcher(getEthersProvider(), config.CHAINLOG_CONTRACT);

let chiefAddress: string = "";
export const initialize = (chiefFetcher: AddressFetcher) => async () => {
  chiefAddress = await chiefFetcher.getChiefAddress("latest");
};

export const provideHandleTransaction = (
  spellsManager: AddressManager,
  lifterManager: AddressManager,
  chiefFetcher: AddressFetcher
): HandleTransaction => {
  return async (transactionEvent: TransactionEvent): Promise<Finding[]> => {
    // Listen to UpdateAddress event & Update the chief contract.
    transactionEvent.filterLog(EVENT_ABI, config.CHAINLOG_CONTRACT).forEach((log) => {
      if (log.args.key == utils.formatBytes32String("MCD_ADM")) {
        chiefFetcher.chiefAddress = log.args.addr;
      }
    });

    const handler: HandleTransaction = provideLiftEventsListener(
      "MakerDAO-GM-2",
      chiefFetcher.chiefAddress,
      spellsManager.isKnownAddress.bind(spellsManager),
      lifterManager.isKnownAddress.bind(lifterManager)
    );

    return handler(transactionEvent);
  };
};
export const provideHandleBlock = (
  threshold: BigNumber,
  addressManager: AddressManager,
  fetcher?: HatFetcher
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (!fetcher) {
      fetcher = new HatFetcher(chiefAddress, getEthersProvider());
    }
    const handler: HandleBlock = provideHatChecker(
      "MakerDAO-GM-1",
      addressManager.isKnownAddress.bind(addressManager),
      threshold,
      fetcher
    );
    // Update the SPELL_DEPLOYER's nonce
    await addressManager.update(blockEvent.blockNumber);
    return handler(blockEvent);
  };
};

export default {
  initialize: initialize(CHIEF_FETCHER),
  handleTransaction: provideHandleTransaction(SPELLS_MANAGER, LIFTER_MANAGER, CHIEF_FETCHER),
  handleBlock: provideHandleBlock(config.MKR_THRESHOLD, SPELLS_MANAGER),
};
