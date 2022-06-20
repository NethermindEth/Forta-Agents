import BigNumber from "bignumber.js";
import { BlockEvent, ethers, Finding, getEthersProvider, HandleBlock, Initialize } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { BALANCE_OF_ABI, FLASH_LOAN_ABI } from "./constants";
import { createFinding, NetworkData, SmartCaller, toBn } from "./utils";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager(CONFIG);

const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleBlock = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): HandleBlock => {
  const vaultIface = new ethers.utils.Interface([FLASH_LOAN_ABI]);
  const tokenIface = new ethers.utils.Interface([BALANCE_OF_ABI]);
  const topics = [vaultIface.getEventTopic("FlashLoan")];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = (
      await provider.getLogs({
        address: networkManager.get("vaultAddress"),
        topics,
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((el) => vaultIface.parseLog(el));

    await Promise.all(
      logs.map(async (log) => {
        const token = SmartCaller.from(new ethers.Contract(log.args.token, tokenIface, provider));

        const vaultBalance = toBn(
          await token.balanceOf(networkManager.get("vaultAddress"), { blockTag: blockEvent.block.parentHash })
        );

        const tvlPercentage = toBn(log.args.amount).dividedBy(vaultBalance).shiftedBy(2);

        if (tvlPercentage.gte(networkManager.get("tvlPercentageThreshold"))) {
          findings.push(createFinding(log, tvlPercentage));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider()),
};
