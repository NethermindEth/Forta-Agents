import { Finding, HandleTransaction, ethers, Initialize, TransactionEvent, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TRANSFER_EVENT, getFindingInstance } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";

const networkManager = new NetworkManager(NM_DATA);

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize {
  return async () => {
    await networkManager.init(provider);
  };
}

export function provideHandleTransaction(
  transferEvent: string,
  networkManager: NetworkManager<NetworkDataInterface>,
  balanceFetcher: BalanceFetcher
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    let alertThreshold = networkManager.get("alertThreshold");

    const findings: Finding[] = [];
    const transferEventTxns = txEvent.filterLog(transferEvent, networkManager.get("monitoredTokens")); // Transfer event transactions for monitored addresses

    await Promise.all(
      transferEventTxns.map(async (transferEvent) => {
        const { from, to, value } = transferEvent.args;
        const valueBN: BigNumber = BigNumber.from(value);

        if (
          !networkManager
            .get("monitoredTokens")
            .map((e) => e.toLowerCase())
            .includes(transferEvent.address)
        ) {
          return findings;
        }

        if (networkManager.get("monitoredAddresses").includes(from)) {
          const prevBalance = await balanceFetcher.getBalance(txEvent.blockNumber - 1, from, transferEvent.address);

          if (valueBN.mul(100).gte(prevBalance.mul(alertThreshold))) {
            findings.push(getFindingInstance(value.toString(), from, transferEvent.address, "false"));
          }
        }

        if (networkManager.get("monitoredAddresses").includes(to)) {
          const prevBalance = await balanceFetcher.getBalance(txEvent.blockNumber - 1, to, transferEvent.address);

          if (valueBN.mul(100).gte(prevBalance.mul(alertThreshold))) {
            findings.push(getFindingInstance(value.toString(), to, transferEvent.address, "true"));
          }
        }
      })
    );
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(TRANSFER_EVENT, networkManager, new BalanceFetcher(getEthersProvider())),
};
