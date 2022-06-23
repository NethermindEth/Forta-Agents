import { Finding, HandleBlock, BlockEvent, getEthersProvider } from "forta-agent";
import { providers, utils, Contract } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, SmartCaller, toBn } from "./utils";
import { EVENT, TOKEN_ABI } from "./constants";
import CONFIG from "./agent.config";
import { createFinding } from "./findings";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const initialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider) => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleBlock = (
  provider: providers.Provider,
  networkManager: NetworkManager<NetworkData>
): HandleBlock => {
  const vaultIface = new utils.Interface(EVENT);

  const topics = [vaultIface.getEventTopic("Transfer")];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = (
      await provider.getLogs({
        address: networkManager.get("balToken"),
        topics,
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((el) => vaultIface.parseLog(el));

    const balContract = new Contract(networkManager.get("balToken"), new utils.Interface(TOKEN_ABI), provider);

    await Promise.all(
      logs.map(async (log) => {
        const { to, from, value } = log.args;

        const bnValue = toBn(value);

        const balToken = SmartCaller.from(balContract);

        const totalSupply = toBn(
          await balToken.totalSupply({
            blockTag: blockEvent.blockNumber,
          })
        );

        const _threshold = totalSupply.multipliedBy(networkManager.get("threshold")).dividedBy(100);

        if (bnValue.gte(_threshold)) {
          const percentage = bnValue.multipliedBy(100).dividedBy(totalSupply);

          findings.push(createFinding(to, from, value, percentage));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: initialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(getEthersProvider(), networkManager),
};
